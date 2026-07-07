import { Job, JobStatus, Webservice } from 'shared/types'
import { error } from 'electron-log'
import { pipelineAPI } from '../../../apis/pipeline'

import { updateJob, selectPipeline } from 'shared/data/slices/pipeline'
import { GetStateFunction } from 'shared/types/store'

import { WebSocket, type CloseEvent } from 'ws'
import {
    JobDataUpdate,
    jobSummaryXmlToJson,
    normalizeJobData,
} from './job-data'
import { processJobStatusUpdate } from './process-job-status-update'
import { jobXmlToJson } from 'shared/parser/pipelineXmlConverter'

type SocketType = 'messages' | 'status' | 'progress'
type RestFetchReason =
    | 'status-socket-check'
    | 'status-socket-closed'
type Timer = NodeJS.Timeout
type Sockets = Partial<Record<SocketType, WebSocket>>
type SocketTimers = Partial<Record<SocketType, Timer>>

const SOCKET_TYPES: SocketType[] = ['messages', 'status', 'progress']
// Poll less often when the status socket is closed to reduce REST XML churn.
const REST_FALLBACK_POLL_INTERVAL_MS = 5000
// REST still checks occasionally while websocket status updates look healthy.
const REST_HEALTHY_POLL_INTERVAL_MS = 15000
// Multiple REST refresh requests share one fetch within this window.
const MIN_REST_FETCH_INTERVAL_MS = 2000
// First websocket reconnect attempt happens quickly after an abnormal close.
const SOCKET_INITIAL_RECONNECT_DELAY_MS = 500
// Reconnect backoff tops out here while the socket keeps failing.
const SOCKET_MAX_RECONNECT_DELAY_MS = 5000
const TERMINAL_STATUSES = [JobStatus.ERROR, JobStatus.FAIL, JobStatus.SUCCESS]

/**
 * Start a job monitor that will continue until the job is done.
 *
 * The monitor will update the job through store dispatch
 * @returns a function that stops polling, reconnecting, and socket updates
 * @param j the job to be monitored
 * @param ws the webservice on which the pipeline handling the job is launched
 * @param getState redux store getState function
 * @param dispatch redux store dispatch function
 */
export function startMonitor(
    j: Job,
    ws: Webservice,
    getState: GetStateFunction,
    dispatch
) {
    if (!j.jobData.notificationsUrl) {
        error('Could not connect socket for job monitoring', j)
        return
    }

    // remove the default search params from notificationsUrl
    let notificationsUrl = new URL(j.jobData.notificationsUrl)
    let baseNotificationsUrl = `${notificationsUrl.protocol}//${notificationsUrl.hostname}:${notificationsUrl.port}${notificationsUrl.pathname}`

    let fetchJobDataFn = pipelineAPI.createPipelineFetchFunction(
        () => j.jobData.href,
        jobXmlToJson
    )
    const sockets: Sockets = {}
    const reconnectTimers: SocketTimers = {}
    const reconnectAttempts: Record<SocketType, number> = {
        messages: 0,
        status: 0,
        progress: 0,
    }
    let pollTimeout: Timer | undefined
    let restPollRunning = false
    let activeRestFetch: Promise<boolean> | undefined
    let cleanedUp = false
    let lastRestFetchAt = Date.now()

    // Single synchronous gate for all terminal-status processing.
    // Because JS is single-threaded, the check+set here is atomic: whichever
    // concurrent async handler resumes first and calls handleJobUpdate wins;
    // any subsequent caller sees the flag already set and returns immediately.
    let terminalStatusReceived = false

    // Stop timers and sockets when the job ends or the caller cancels monitoring.
    const cleanupMonitor = () => {
        if (cleanedUp) return
        cleanedUp = true
        if (pollTimeout) {
            clearTimeout(pollTimeout)
            pollTimeout = undefined
        }
        SOCKET_TYPES.forEach((type) => {
            const timer = reconnectTimers[type]
            if (timer) {
                clearTimeout(timer)
                delete reconnectTimers[type]
            }
        })
        SOCKET_TYPES.forEach((type) => {
            sockets[type]?.close()
            delete sockets[type]
        })
    }

    // Run terminal-job side effects once, then hand the job update to Redux.
    const handleJobUpdate = (jobUpdateData: JobDataUpdate) => {
        if (TERMINAL_STATUSES.includes(jobUpdateData.status)) {
            if (terminalStatusReceived) return
            terminalStatusReceived = true
            cleanupMonitor()
        }
        processJobStatusUpdate(currentJob(), getState, dispatch, jobUpdateData)
    }

    // Re-read the job so long-running monitor updates do not overwrite newer state.
    const currentJob = () =>
        selectPipeline(getState()).jobs.find(
            (job) => job.internalId === j.internalId
        ) ?? j

    // Explain why the next scheduled REST poll is needed.
    const scheduledRestFetchReason = (): RestFetchReason => {
        const statusSocketIsActive =
            sockets.status?.readyState === WebSocket.OPEN
        if (!statusSocketIsActive) return 'status-socket-closed'
        return 'status-socket-check'
    }

    // Merge REST/socket job data into the current Redux job.
    const dispatchJobDataUpdate = (jobUpdateData: Partial<JobDataUpdate>) => {
        const job = currentJob()
        const normalizedJobUpdateData = normalizeJobData(jobUpdateData)
        dispatch(
            updateJob({
                ...job,
                jobData: {
                    ...job.jobData,
                    ...normalizedJobUpdateData,
                },
            })
        )
    }

    // Fetch a full job snapshot over REST, including messages.
    const fetchJobData = async () => {
        const fetchData = normalizeJobData(await fetchJobDataFn(ws))
        lastRestFetchAt = Date.now()
        return fetchData
    }

    // Read small websocket status/progress fragments without forcing a full
    // message parse for every notification payload.
    const readSocketSummary = (data: WebSocket.RawData) =>
        normalizeJobData(jobSummaryXmlToJson(data))

    // Fetch terminal job metadata/results/log, including the final message tree.
    const fetchTerminalJobData = fetchJobData

    // Request a REST refresh, reusing or throttling fetches when possible.
    const fetchAndDispatchJobData = async (force = false) => {
        // Share one REST fetch if several socket/poll events ask at once.
        if (activeRestFetch) return activeRestFetch
        if (
            !force &&
            Date.now() - lastRestFetchAt < MIN_REST_FETCH_INTERVAL_MS
        ) {
            return false
        }
        // Fetch job status from REST, then either finish or merge it into state.
        activeRestFetch = (async () => {
            const fetchData = await fetchJobData()
            if (TERMINAL_STATUSES.includes(fetchData.status)) {
                handleJobUpdate(fetchData as JobDataUpdate)
                return true
            }
            dispatchJobDataUpdate(fetchData)
            if (!restPollRunning) scheduleNextPoll()
            return false
        })().finally(() => {
            activeRestFetch = undefined
        })
        return activeRestFetch
    }

    // Schedule the next REST fallback poll based on websocket freshness.
    const scheduleNextPoll = () => {
        if (terminalStatusReceived || cleanedUp) return
        if (restPollRunning || activeRestFetch) return
        if (pollTimeout) clearTimeout(pollTimeout)
        const reason = scheduledRestFetchReason()
        const interval = reason !== 'status-socket-check'
            ? REST_FALLBACK_POLL_INTERVAL_MS
            : REST_HEALTHY_POLL_INTERVAL_MS
        const delay = Math.max(interval - (Date.now() - lastRestFetchAt), 0)
        pollTimeout = setTimeout(pollJobData, delay)
    }

    // Run one scheduled REST fallback poll and always schedule the next one.
    const pollJobData = async () => {
        if (terminalStatusReceived || cleanedUp) return
        if (restPollRunning) {
            scheduleNextPoll()
            return
        }
        restPollRunning = true
        try {
            await fetchAndDispatchJobData()
        } catch (e) {
            if (!terminalStatusReceived) {
                error('Error polling data for job', j, e)
            }
        } finally {
            restPollRunning = false
            scheduleNextPoll()
        }
    }

    // Update the messages field from websocket activity, checking REST for
    // terminal state while we are there.
    let socketOnMessage = async (event) => {
        const wsJobData = normalizeJobData(jobXmlToJson(event.data))
        if (wsJobData.messages && wsJobData.messages.length > 0) {
            const fetchData = await fetchJobData()
            if (TERMINAL_STATUSES.includes(fetchData.status)) {
                handleJobUpdate(fetchData)
                return
            }
            dispatchJobDataUpdate({ messages: fetchData.messages })
        }
        scheduleNextPoll()
    }

    // Just update progress if it exists, with a full REST check to catch
    // terminal state.
    let socketOnProgress = async (event) => {
        const wsJobData = readSocketSummary(event.data)
        if (wsJobData.progress !== undefined) {
            if (!terminalStatusReceived) {
                const fetchData = await fetchJobData()
                if (TERMINAL_STATUSES.includes(fetchData.status)) {
                    handleJobUpdate(fetchData)
                    return
                }
            }
            dispatchJobDataUpdate({ progress: wsJobData.progress })
        }
        scheduleNextPoll()
    }

    // update the status field and handle completed jobs
    let socketOnStatus = async (event) => {
        const wsJobData = readSocketSummary(event.data)
        if (wsJobData.status && TERMINAL_STATUSES.includes(wsJobData.status)) {
            let fetchData: JobDataUpdate
            try {
                // Fetch terminal results/log data, including messages.
                fetchData = await fetchTerminalJobData()
            } catch (e) {
                error('Error fetching terminal data for job', j, e)
                fetchData = currentJob().jobData as JobDataUpdate
            }
            // REST can briefly lag behind the status socket, so keep the socket status.
            handleJobUpdate(
                normalizeJobData({
                    ...fetchData,
                    ...wsJobData,
                }) as JobDataUpdate
            )
        } else if (wsJobData.status) {
            const fetchData = await fetchJobData()
            if (TERMINAL_STATUSES.includes(fetchData.status)) {
                handleJobUpdate(fetchData)
                return
            }
            dispatchJobDataUpdate({ ...fetchData, status: wsJobData.status })
        }
        scheduleNextPoll()
    }

    // Log socket errors; reconnect handling happens in the close handler.
    let socketOnError = () => error('Job monitoring failed')

    // Reopen a failed websocket with capped backoff.
    const scheduleReconnect = (type: SocketType) => {
        if (
            terminalStatusReceived ||
            cleanedUp ||
            reconnectTimers[type] !== undefined
        ) {
            return
        }
        const delay = Math.min(
            SOCKET_INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempts[type],
            SOCKET_MAX_RECONNECT_DELAY_MS
        )
        reconnectAttempts[type] += 1
        reconnectTimers[type] = setTimeout(() => {
            delete reconnectTimers[type]
            connect(type)
        }, delay)
    }

    // Reconnect closed sockets while the job is still non-terminal.
    const socketOnClose = (type: SocketType) => async (event: CloseEvent) => {
        if (terminalStatusReceived || cleanedUp) return
        if (sockets[type] === event.target) {
            delete sockets[type]
        }
        try {
            const fetchData = await fetchJobData()
            if (TERMINAL_STATUSES.includes(fetchData.status)) {
                handleJobUpdate(fetchData)
                return
            }
            dispatchJobDataUpdate(fetchData)
        } catch (e) {
            if (!terminalStatusReceived) {
                error('Error fetching data after socket close for job', j, e)
            }
        }
        scheduleReconnect(type)
        scheduleNextPoll()
    }

    // Build the engine notification URL for one socket type.
    const socketUrl = (type: SocketType) => {
        const url = new URL(baseNotificationsUrl)
        url.searchParams.set('type', type)
        return url.toString()
    }

    // Open one websocket and attach the right message handler.
    const connect = (type: SocketType) => {
        if (terminalStatusReceived || cleanedUp) return
        const socket = new WebSocket(socketUrl(type))
        sockets[type] = socket
        socket.addEventListener('open', () => {
            reconnectAttempts[type] = 0
            scheduleNextPoll()
        })
        const messageHandler =
            type === 'messages'
                ? socketOnMessage
                : type === 'progress'
                  ? socketOnProgress
                  : socketOnStatus
        socket.addEventListener('message', messageHandler)
        socket.addEventListener('error', socketOnError)
        socket.addEventListener('close', socketOnClose(type))
    }

    SOCKET_TYPES.forEach(connect)
    scheduleNextPoll()
    return cleanupMonitor
}
