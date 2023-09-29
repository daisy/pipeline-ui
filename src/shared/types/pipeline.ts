import { Voice } from './ttsConfig'

/**
 * Webservice connexion data to compute url for fetch:
 *
 * - host should be a valid ipv4 or hostname
 * - port should be a number matching an opened port on the host
 * - path should be a valid url subpath, starting by a "/" (but not ending by a "/"), like "/ws"
 * - ssl is a boolean stating if the webservice is using ssl encryptin (requiring https)
 *
 */
export type Webservice = {
    host: string
    port?: number
    path?: string
    ssl?: boolean
}
/**
 * Utility function to get base url string from webservice
 * @param ws webservice
 * @returns
 */
export function baseurl(ws: Webservice) {
    if (!ws) return ''
    // eslint-disable-next-line
    return `${ws.ssl ? 'https' : 'http'}://${ws.host}${ws.port ? ':' + ws.port : ''}${ws.path ?? ''}`
}

/**
 * Local instance possible status
 */
export enum PipelineStatus {
    UNKNOWN = 'unknown',
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPED = 'stopped',
    ERROR = 'error',
}

/**
 * Local instance state to be used by front
 */
export type PipelineState = {
    webservice?: Webservice
    status: PipelineStatus
    jobs?: Job[]
    scripts?: Script[]
    voices?: Voice[]
    internalJobCounter?: number
    selectedJobId: string
    datatypes?: Datatype[]
    alive: Alive
    // messages: Array<string>
    // errors: Array<string>
}

/**
 * Properties for initializing ipc with the daisy pipeline 2
 *
 */
export type PipelineInstanceProperties = {
    /**
     * optional path of the local installation of the pipeline,
     *
     * defaults to the application resources/daisy-pipeline
     */
    localPipelineHome?: string

    appDataFolder?: string

    logsFolder?: string
    /**
     * optional path to the java runtime
     *
     * defaults to the application resource/jre folder
     */
    jrePath?: string

    /**
     * Webservice configuration to use for embedded pipeline,
     *
     * defaults to a localhost managed configuration :
     * ```js
     * {
     *      host: "localhost"
     *      port: 0, // will search for an available port on the current host when calling launch() the first time
     *      path: "/ws"
     * }
     * ```
     *
     */
    webservice?: Webservice

    /**
     *
     */
    onError?: (error: string) => void

    onMessage?: (message: string) => void
}

/**
 * Properties for running a DAISY pipeline instance.
 */
export interface PipelineInstanceProps {
    /**
     * optional path of the local installation of the pipeline,
     *
     * defaults to the application resources/daisy-pipeline
     */
    localPipelineHome?: string

    appDataFolder?: string

    logsFolder?: string
    /**
     * optional path to the java runtime
     *
     * defaults to the application resource/jre folder
     */
    jrePath?: string

    /**
     * Webservice configuration to use for embedded pipeline,
     *
     * defaults to a localhost managed configuration :
     * ```js
     * {
     *      host: "localhost"
     *      port: 0, // will search for an available port on the current host when calling launch() the first time
     *      path: "/ws"
     * }
     * ```
     *
     */
    webservice?: Webservice

    /**
     *
     */
    onError?: (error: string) => void

    onMessage?: (message: string) => void
}

export type Alive = {
    alive: boolean
    localfs?: boolean
    authentication?: boolean
    version?: string
}

export enum Priority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum JobStatus {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    IDLE = 'IDLE',
    RUNNING = 'RUNNING',
    FAIL = 'FAIL',
}

export type ResultFile = {
    mimeType: string
    size: string
    file?: string
    href?: string
}
export type NamedResult = {
    from: string
    href: string
    mimeType: string
    name: string
    nicename: string
    desc: string
    files: Array<ResultFile>
}

export type Results = {
    href: string
    mimeType: string
    namedResults: Array<NamedResult>
}

export enum MessageLevel {
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    TRACE = 'TRACE',
}

export type Message = {
    level: MessageLevel
    content: string
    sequence: number
    timestamp: number
    messages?: Array<Message>
}

export type Job = {
    internalId: string // the ID assigned internally by the UI
    index?: number
    state: JobState
    jobData?: JobData
    jobRequest?: JobRequest
    script?: Script
    errors?: Array<{
        fieldName?: string
        error: string
    }>
    /**
     * Internal ID of a job this job is linked to.
     *
     * (type of link is to be defined, for now this is to link to a backup when editing a job)
     */
    linkedTo?: string
    /**
     * Hiding a job from UI.
     *
     * (case of temporary copies that are kept in store while not displayed
     * and are to be destroyed on completion or restoration)
     */
    invisible?: boolean
    // jobRequest.script also has script info (returned from ws);
    // however, storing it separately gives us access to more details
}
// JobData is the JSON representation of Pipeline WS data for a single job
export type JobData = {
    type: 'JobRequestSuccess'
    jobId: string // the ID from the pipeline
    priority?: Priority
    status?: JobStatus
    log?: string
    results?: Results
    /**
     *  Job results download folder on the user disk.
     *
     * (computed by the job monitor of the redux pipeline middleware)
     */
    downloadedFolder?: string
    messages?: Array<Message>
    progress?: number
    script?: Script
    nicename?: string
    scriptHref?: string
    href: string
}

// thrown by the pipeline when a job request could not be processed
export type JobRequestError = {
    type: 'JobRequestError'
    description?: string
    trace?: string
}

export enum JobState {
    NEW,
    SUBMITTED,
}

export type ScriptItemBase = {
    desc?: string
    mediaType?: Array<string>
    name: string
    sequence?: boolean
    required?: boolean
    nicename?: string
    type?: string
    kind?: string
    ordered?: boolean
}
export type ScriptInput = ScriptItemBase & {
    type: 'anyFileURI'
    kind: 'input'
    ordered: false
}

export type ScriptOption = ScriptItemBase & {
    type: string
    default?: string
    kind: 'option'
}

export type Script = {
    id: string
    href: string
    nicename: string
    description: string
    version?: string
    inputs?: Array<ScriptInput>
    options?: Array<ScriptOption>
    homepage?: string
}

export type NameValue = {
    name: string
    value: any
    isFile: boolean
}
export type Callback = {
    href: string
    type: ['messages', 'status']
    frequency: string
}
export type JobRequest = {
    scriptHref: string
    nicename?: string
    priority?: ['high', 'medium', 'low']
    batchId?: string
    inputs?: Array<NameValue>
    options?: Array<NameValue>
    outputs?: Array<NameValue>
    callbacks?: Array<Callback>
}
export type Datatype = {
    href: string
    id: string
    choices?: DatatypeChoice[]
}

export type DatatypeChoice = {
    documentation?: string
}
export type ValueChoice = DatatypeChoice & {
    value?: string
}

export type TypeChoice = DatatypeChoice & {
    type?: string
    pattern?: string
}
