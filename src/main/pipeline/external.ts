import { error, info } from 'electron-log'
import { store } from 'main/data/store'
import { pipelineAPI } from 'main/data/apis/pipeline'
import {
    setAlive,
    selectPipeline,
    selectStatus,
    setStatus,
    useWebservice,
} from 'shared/data/slices/pipeline'
import {
    ExternalEngineConfig,
    PipelineInstanceProperties,
    PipelineState,
    PipelineStatus,
    Webservice,
    baseurl,
} from 'shared/types'
import { EngineController } from './pipeline'

const healthCheckIntervalMs = 15000

function externalEngineErrorMessage(err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    if (message.includes('ECONNREFUSED')) {
        return 'No Pipeline server responded at this address. Check that the server is running and that the URL is correct.'
    }
    if (message.includes('ENOTFOUND') || message.includes('EAI_AGAIN')) {
        return 'The Pipeline server name could not be found. Check the host name and your network connection.'
    }
    if (message.includes('ETIMEDOUT') || message.includes('AbortError')) {
        return 'The connection to the Pipeline server timed out.'
    }
    if (message.includes('ECONNRESET')) {
        return 'The Pipeline server closed the connection before responding.'
    }

    return 'Could not connect to the external Pipeline server.'
}

export class ExternalEngineController implements EngineController {
    props: PipelineInstanceProperties
    messages: Array<string>
    messagesListeners: Map<string, (data: string) => void> = new Map<
        string,
        (data: string) => void
    >()

    errors: Array<string>
    errorsListeners: Map<string, (data: string) => void> = new Map<
        string,
        (data: string) => void
    >()

    private healthCheckInterval?: ReturnType<typeof setInterval>
    private healthCheckInProgress = false
    private lastConnectionError?: string
    private stopped = true

    constructor(config?: ExternalEngineConfig) {
        this.props = {
            webservice: config?.webservice
                ? { ...config.webservice }
                : undefined,
            onError: error,
            onMessage: info,
        }
        this.errors = []
        this.messages = []
        store.dispatch(setStatus(PipelineStatus.STOPPED))
    }

    pushMessage(message: string) {
        this.messages.push(message)
        if (this.props.onMessage) {
            this.props.onMessage(message)
        }
        this.messagesListeners.forEach((callback) => {
            callback(message)
        })
    }

    pushError(message: string) {
        this.errors.push(message)
        if (this.props.onError) {
            this.props.onError(message)
        }
        this.errorsListeners.forEach((callback) => {
            callback(message)
        })
    }

    async launch(): Promise<PipelineState> {
        if (!this.stopped) {
            const status = selectStatus(store.getState())
            if (
                status === PipelineStatus.STARTING ||
                status === PipelineStatus.RUNNING
            ) {
                return selectPipeline(store.getState())
            }
        }

        const webservice = this.props.webservice
        if (!webservice?.host) {
            const message = 'External Pipeline engine is not configured.'
            this.pushError(message)
            store.dispatch(setStatus(PipelineStatus.ERROR))
            return selectPipeline(store.getState())
        }

        this.stopped = false
        store.dispatch(setStatus(PipelineStatus.STARTING))
        this.pushMessage(
            `Connecting to external Pipeline at ${baseurl(webservice)}`
        )
        this.startHealthCheck(webservice)

        await this.checkExternalEngine(webservice, true)

        return selectPipeline(store.getState())
    }

    async stop(appIsClosing = false) {
        this.stopped = true
        this.lastConnectionError = undefined
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval)
            this.healthCheckInterval = undefined
        }
        if (appIsClosing) {
            this.messagesListeners.clear()
            this.errorsListeners.clear()
        }
        store.dispatch(setStatus(PipelineStatus.STOPPED))
    }

    registerMessagesListener(
        callerID: string,
        callback: (data: string) => void
    ) {
        this.messagesListeners.set(callerID, callback)
    }

    removeMessageListener(callerID: string) {
        this.messagesListeners.delete(callerID)
    }

    registerErrorsListener(callerID: string, callback: (data: string) => void) {
        this.errorsListeners.set(callerID, callback)
    }

    removeErrorsListener(callerID: string) {
        this.errorsListeners.delete(callerID)
    }

    private startHealthCheck(webservice: Webservice) {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval)
        }

        this.healthCheckInterval = setInterval(() => {
            this.checkExternalEngine(webservice)
        }, healthCheckIntervalMs)
    }

    private async checkExternalEngine(
        webservice: Webservice,
        loadWebserviceData = false
    ) {
        if (this.stopped || this.healthCheckInProgress) return

        this.healthCheckInProgress = true
        try {
            const alive = await pipelineAPI.fetchAlive()(webservice)
            if (this.stopped) return
            if (!alive.alive) {
                throw new Error(
                    'The server did not return a valid /alive response.'
                )
            }

            const status = selectStatus(store.getState())
            const recovering = status === PipelineStatus.ERROR

            this.lastConnectionError = undefined
            store.dispatch(setAlive(alive))

            if (
                loadWebserviceData ||
                status === PipelineStatus.ERROR ||
                status === PipelineStatus.STOPPED ||
                status === PipelineStatus.UNKNOWN
            ) {
                if (recovering) {
                    this.pushMessage(
                        `External Pipeline is reachable again at ${baseurl(
                            webservice
                        )}`
                    )
                }
                store.dispatch(setStatus(PipelineStatus.STARTING))
                store.dispatch(useWebservice(webservice))
            }
        } catch (err) {
            if (this.stopped) return

            const message = externalEngineErrorMessage(err)
            if (
                this.lastConnectionError !== message ||
                selectStatus(store.getState()) !== PipelineStatus.ERROR
            ) {
                this.pushError(message)
                this.lastConnectionError = message
            }
            store.dispatch(setStatus(PipelineStatus.ERROR))
        } finally {
            this.healthCheckInProgress = false
        }
    }
}
