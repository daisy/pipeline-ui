import { Job, JobState, JobStatus, Webservice } from 'shared/types'
import { info, error, debug } from 'electron-log'
import { pipelineAPI } from '../../apis/pipeline'
import { downloadJobLog, downloadJobResults } from './download'

import { selectDownloadPath } from 'shared/data/slices/settings'
import {
    updateJob,
    setAnnouncement,
    selectPipeline,
} from 'shared/data/slices/pipeline'
import { ParserException } from 'shared/parser/pipelineXmlConverter/parser'
import { GetStateFunction } from 'shared/types/store'

import { WebSocket } from 'ws'
import { readableStatus } from 'shared/jobName'
import { jobXmlToJson } from 'shared/parser/pipelineXmlConverter'

/**
 * Start a job monitor that will continue until the job is done.
 *
 * The monitor will update the job through store dispatch
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

    const messagesSocket = new WebSocket(
        baseNotificationsUrl + '?type=messages'
    )
    const statusSocket = new WebSocket(baseNotificationsUrl + '?type=status')
    const progressSocket = new WebSocket(
        baseNotificationsUrl + '?type=progress'
    )

    let fetchJobDataFn = pipelineAPI.fetchJobData(j)

    // refetch the job and update only the messages field
    let socketOnMessage = async (event) => {
        let jobUpdateData = jobXmlToJson(event.data)
        if (jobUpdateData.messages && jobUpdateData.messages.length > 0) {
            const fetchData = await fetchJobDataFn(ws)
            const currentJob =
                selectPipeline(getState()).jobs.find(
                    (job) => job.internalId === j.internalId
                ) ?? j
            let updatedJob = {
                ...currentJob,
                jobData: {
                    ...currentJob.jobData,
                    messages: fetchData.messages,
                },
            }
            dispatch(updateJob(updatedJob))
        }
    }

    // just update the job progress field if exists
    let socketOnProgress = async (event) => {
        let jobUpdateData = jobXmlToJson(event.data)
        if (jobUpdateData.progress) {
            const currentJob =
                selectPipeline(getState()).jobs.find(
                    (job) => job.internalId === j.internalId
                ) ?? j
            let updatedJob = {
                ...currentJob,
                jobData: {
                    ...currentJob.jobData,
                    progress: jobUpdateData.progress,
                },
            }
            dispatch(updateJob(updatedJob))
        }
    }
    // update the status field and handle completed jobs
    let socketOnStatus = async (event) => {
        debug('socketOnStatus event.data', event.data)
        const wsJobData = jobXmlToJson(event.data)
        debug('socketOnStatus wsJobData.status', wsJobData.status)
        const fetchData = await fetchJobDataFn(ws)
        debug('socketOnStatus fetchData.status', fetchData.status)
        // The WS event data has the authoritative status;
        // the REST API may be momentarily stale
        if (wsJobData.status) {
            fetchData.status = wsJobData.status
        }
        await processJobStatusUpdate(j, getState, dispatch, fetchData)
    }
    let socketOnError = (err) => error('Job monitoring failed')

    messagesSocket.addEventListener('message', socketOnMessage)
    statusSocket.addEventListener('message', socketOnStatus)
    progressSocket.addEventListener('message', socketOnProgress)

    messagesSocket.addEventListener('error', socketOnError)
    statusSocket.addEventListener('error', socketOnError)
    progressSocket.addEventListener('error', socketOnError)
}

function processJobStatusUpdate(
    j: Job,
    getState: GetStateFunction,
    dispatch,
    jobUpdateData: any
) {
    try {
        let updatedJob = {
            ...j,
            jobData: jobUpdateData,
        }
        const finished = [
            JobStatus.ERROR,
            JobStatus.FAIL,
            JobStatus.SUCCESS,
        ].includes(jobUpdateData.status)
        debug(
            'processJobStatusUpdate status:',
            jobUpdateData.status,
            'finished:',
            finished,
            'resultsDownloaded:',
            updatedJob.resultsDownloaded,
            'logDownloaded:',
            updatedJob.logDownloaded
        )
        if (finished) {
            updatedJob.state = JobState.ENDED
        }
        const newJobName = `${
            updatedJob.jobData.nicename ?? updatedJob.jobData.script.nicename
        }_${timestamp()}`
        const downloadFolder = selectDownloadPath(getState())

        if (
            updatedJob.jobData?.results?.namedResults &&
            !updatedJob.resultsDownloaded
        ) {
            debug('processJobStatusUpdate: downloading results')
            // If job has results, download them
            downloadJobResults(updatedJob, `${downloadFolder}/${newJobName}`)
                .then((downloadedJob) => {
                    downloadedJob.resultsDownloaded = true
                    debug(
                        'processJobStatusUpdate: dispatching after results download, state:',
                        downloadedJob.state,
                        'status:',
                        downloadedJob.jobData?.status
                    )
                    dispatch(updateJob(downloadedJob))
                    // Only delete job if it has been downloaded
                    if (downloadedJob.jobData.downloadedFolder) {
                        const deleteJob = pipelineAPI.deleteJob(downloadedJob)
                        deleteJob().then((response) => {
                            info(
                                downloadedJob.jobData.jobId,
                                'delete response',
                                response.status,
                                response.statusText
                            )
                        })
                    }
                })
                .catch((e) => {
                    error('Error downloading job results', e)
                })
        } else if (finished && !updatedJob.logDownloaded) {
            debug(
                'processJobStatusUpdate: finished without results, downloading log'
            )
            // job is finished wihout results : keep the log
            downloadJobLog(updatedJob, `${downloadFolder}/${newJobName}`).then(
                (jobWithLog) => {
                    jobWithLog.logDownloaded = true
                    debug(
                        'processJobStatusUpdate: dispatching after log download, state:',
                        jobWithLog.state,
                        'status:',
                        jobWithLog.jobData?.status
                    )
                    dispatch(updateJob(jobWithLog))
                    const deleteJob = pipelineAPI.deleteJob(jobWithLog)
                    deleteJob().then((response) => {
                        info(
                            jobWithLog.jobData.jobId,
                            'delete response',
                            response.status,
                            response.statusText
                        )
                    })
                }
            )
        } else {
            dispatch(updateJob(updatedJob))
        }
    } catch (e) {
        error('Error fetching data for job', j, e)
        dispatch(
            updateJob({
                ...j,
                jobData: {
                    ...j.jobData,
                    status: JobStatus.ERROR,
                },
                errors: [
                    {
                        error:
                            e instanceof ParserException
                                ? e.parsedText
                                : String(e),
                    },
                ],
            })
        )
    }
}

// prettier-ignore
/**
 * generate a timestamp string
 * @returns a timestamp string in format YYYY-MM-DD-HHmmss.sss
 */
export const timestamp = () => {
    const currentTime = new Date(Date.now())
    return `${
        currentTime.getFullYear()
    }-${
        (currentTime.getMonth() + 1)
            .toString()
            .padStart(2, '0')
    }-${
        (currentTime.getDate())
            .toString()
            .padStart(2, '0')
    }-${
        currentTime.getHours().toString().padStart(2, '0')
    }${
        currentTime.getMinutes().toString().padStart(2, '0')
    }${
        currentTime.getSeconds().toString().padStart(2,'0')
    }.${
        currentTime.getMilliseconds()}`
}
