import { TtsEngineState, TtsVoice } from './ttsConfig'

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
    ttsVoices?: TtsVoice[] // the voices from the /voices endpoint
    internalJobCounter?: number
    selectedJobId: string
    datatypes?: Datatype[]
    alive: Alive
    properties?: { [key: string]: EngineProperty }
    ttsEnginesStates?: { [key: string]: TtsEngineState }
    // messages: Array<string>
    // errors: Array<string>
}

export enum PipelineType {
    embedded = 'Use embedded DAISY Pipeline 2',
    // For later use : system wide already installed pipeline 2, and remotely installed pipeline
    // system = 'Use and manage an other installed DAISY Pipeline 2 (with webservice module)',
    // remote = 'Use a remote DAISY Pipeline 2',
}

/**
 * Properties for initializing ipc with the daisy pipeline 2
 * - also include the type of instance managed by IPC (embedded, system, or remote)
 *
 */
export type PipelineInstanceProperties = {
    pipelineType?: keyof typeof PipelineType
    /**
     * optional path of the local installation of the pipeline,
     *
     * defaults to the application resources/daisy-pipeline
     */
    pipelineHome?: string

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
 * Properties managed by the underlying pipeline engine itself
 */
export type EngineProperty = {
    name: string
    href?: string
    desc?: string
    value?: string
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
    jobRequestError?: JobRequestError
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
    /**
     * For job with a stylesheet parameter, supplementary options are retrieved
     * from the pipeline stylesheet-parameters end point and stored here.
     */
    stylesheetParameters?: ScriptOption[]
}
// JobData is the JSON representation of Pipeline WS data for a single job
export type JobData = {
    type?: 'JobRequestSuccess' // returned by the pipeline on success
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
    type: 'JobRequestError' | 'JobUnknownResponse'
    description?: string
    trace?: string
}

export enum JobState {
    NEW,
    SUBMITTING,
    SUBMITTED,
    ENDED,
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
    pattern?: string // for custom pattern validation
    isStylesheetParameter?: boolean
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
    isStylesheetParameter: boolean
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
    stylesheetParameterOptions?: Array<NameValue>
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
