import {
    useWebservice,
    setScripts,
    setDatatypes,
    setStatus,
    removeJob,
    runJob,
    updateJob,
    selectWebservice,
    selectStatus,
    start,
    stop,
    updateScript,
    updateDatatype,
    selectJobs,
    newJob,
    addJob,
    selectPipeline,
    selectJob,
    removeJobs,
    selectVisibleJobs,
    setAlive,
    setTtsVoices,
    setProperties,
    setTtsEngineState,
    setTtsEngineFeatures,
    requestStylesheetParameters,
} from 'shared/data/slices/pipeline'

import {
    Datatype,
    Job,
    JobState,
    JobStatus,
    NamedResult,
    PipelineStatus,
    ResultFile,
    Script,
    TtsVoice,
    TtsEngineProperty,
    Webservice,
    JobData,
    JobRequestError,
    EngineProperty,
    PipelineState,
    TtsEngineState,
    ScriptOption,
} from 'shared/types'

import { info, error } from 'electron-log'

import { pipelineAPI } from '../apis/pipeline'
import { PayloadAction } from '@reduxjs/toolkit'
import { saveFile, unzipFile } from 'main/factories/ipcs/file'
import {
    selectDownloadPath,
    selectPipelineProperties,
    selectSettings,
    selectTtsConfig,
} from 'shared/data/slices/settings'
import { ParserException } from 'shared/parser/pipelineXmlConverter/parser'
import { PipelineInstance } from 'main/factories'
import { RootState } from 'shared/types/store'
import { dialog, ipcMain } from 'electron'
import { IPC } from 'shared/constants/ipc'
import { pathToFileURL } from 'url'
import { MainWindow, MainWindowInstance } from 'main/windows'

// prettier-ignore
/**
 * generate a timestamp string
 * @returns a timestamp string in format YYYY-MM-DD-HHmmss.sss
 */
const timestamp = () => {
    const currentTime = new Date(Date.now())
    return `${
        currentTime.getFullYear()
    }-${
        (currentTime.getMonth() + 1)
            .toString()
            .padStart(2, '0')
    }-${
        (currentTime.getDay() + 1)
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

async function downloadResultFile(r: ResultFile, targetUrl: string) {
    return pipelineAPI
        .fetchResult(r)()
        .then((buffer) =>
            r.mimeType === 'application/zip'
                ? unzipFile(buffer, targetUrl)
                : saveFile(buffer, targetUrl)
        )
        .then(() => {
            let newResult: ResultFile = Object.assign({}, r)
            newResult.file = targetUrl
            return newResult
        })
        .catch(() => r) // if a problem occured, return the original result
}

async function downloadNamedResult(r: NamedResult, targetUrl: string) {
    return pipelineAPI
        .fetchResult(r)()
        .then((buffer) =>
            r.mimeType === 'application/zip'
                ? unzipFile(buffer, targetUrl)
                : saveFile(buffer, targetUrl)
        )
        .then((files) => {
            const filesUrls = files.map((f) => pathToFileURL(f))
            let newResult: NamedResult = Object.assign({}, r)
            newResult.href = targetUrl
            newResult.files = newResult.files.map((res) => {
                let newResultFile: ResultFile = Object.assign({}, res)
                const urlFound = filesUrls.find((furl) =>
                    res.file.endsWith(furl.href.substring(targetUrl.length))
                )
                if (urlFound) {
                    newResultFile.file = urlFound.href
                }
                return newResultFile
            })
            return newResult
        })
        .catch(() => r) // if a problem occured, return the original result
}

async function downloadJobResults(j: Job, targetFolder: string) {
    // Download and unzip named results archives
    return Promise.all(
        j.jobData.results.namedResults.map((r) =>
            downloadNamedResult(
                r,
                new URL(`${targetFolder}/${r.nicename ?? r.name}`).href
            )
        )
    ).then((downloadedNamedResults: NamedResult[]) => {
        return {
            ...j,
            jobData: {
                ...j.jobData,
                downloadedFolder: targetFolder,
                results: {
                    ...j.jobData.results,
                    namedResults: [...downloadedNamedResults],
                },
            },
        } as Job
    })
}

/**
 * Start a job monitor that will continue until the job is done.
 *
 * The monitor will update the job through store dispatch
 * @param j the job to be monitored
 * @param ws the webservice on which the pipeline handling the job is launched
 * @param getState redux store getState function
 * @param dispatch redux store dispatch function
 */
function startMonitor(j: Job, ws: Webservice, getState, dispatch) {
    let monitor = null
    const fetchJobData = pipelineAPI.fetchJobData(j)
    monitor = setInterval(() => {
        if (selectStatus(getState()) == PipelineStatus.STOPPED) {
            error('The pipeline has stopped working while executing job', j)
            clearInterval(monitor)
        } else
            fetchJobData(ws)
                .then((value) => {
                    // info('received job data ', value)
                    // don't log the job messages, it's too verbose
                    info('received job data ', {
                        ...value,
                        messages: ['removed to keep log cleaner'],
                    })
                    if (
                        [
                            JobStatus.ERROR,
                            JobStatus.FAIL,
                            JobStatus.SUCCESS,
                        ].includes(value.status)
                    ) {
                        // Job is finished or in error, stop monitor
                        clearInterval(monitor)
                    }
                    let updatedJob = { ...j }
                    updatedJob.jobData = value
                    // If job has results, download them
                    if (updatedJob.jobData && updatedJob.jobData.results) {
                        const newJobName = `${
                            updatedJob.jobData.nicename ??
                            updatedJob.jobData.script.nicename
                        }_${timestamp()}`
                        //`${settings.downloadFolder}/${newJobName}/${namedResult.name}`
                        const downloadFolder = selectDownloadPath(getState())
                        downloadJobResults(
                            updatedJob,
                            `${downloadFolder}/${newJobName}`
                        ).then((downloadedJob) => {
                            dispatch(updateJob(downloadedJob))
                        })
                    } else dispatch(updateJob(updatedJob))
                })
                .catch((e) => {
                    error('Error fetching data for job', j, e)
                    if (j.jobRequestError) {
                        clearInterval(monitor)
                    }
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
                })
    }, 1000)
}

// Store managed pipeline instance
let _pipeline_instance: PipelineInstance = null

/**
 * Get the store managed pipeline instance
 * (to use only on the backend and after the store is initialized )
 * @param state the current store state, required to initialize the instance
 * @returns the initialized pipeline instance
 */
export const getPipelineInstance = (state: RootState): PipelineInstance => {
    try {
        if (_pipeline_instance == null) {
            _pipeline_instance = new PipelineInstance(
                selectPipelineProperties(state)
            )
        }
        return _pipeline_instance
    } catch (e) {
        error(e)
        return null
    }
}

export function registerInstanceManagementIPCs() {
    // get properties of the instance
    ipcMain.handle(IPC.PIPELINE.PROPS, (event) => {
        return (_pipeline_instance && _pipeline_instance.props) || null
    })

    // get messages from the instance
    ipcMain.handle(IPC.PIPELINE.MESSAGES.GET, (event) => {
        return (_pipeline_instance && _pipeline_instance.messages) || null
    })
    // get errors from the instance
    ipcMain.handle(IPC.PIPELINE.ERRORS.GET, (event) => {
        return (_pipeline_instance && _pipeline_instance.errors) || null
    })
}

/**
 * Middleware to fetch data from the pipeline
 * and manage a local pipeline instance
 * @param param0
 * @returns
 */
export function pipelineMiddleware({ getState, dispatch }) {
    return (next) => (action: PayloadAction<any>) => {
        // Note : might be a better idea to call the getState in the intervals
        const state = getState()
        const webservice = selectWebservice(state)
        const currentJobs = selectJobs(state)
        switch (action.type) {
            case start.type:
                getPipelineInstance(state)?.launch()
                break
            case stop.type:
                getPipelineInstance(state)?.stop(action.payload)
                break
            case useWebservice.type:
                // Action dispatched when the pipeline instance is launched
                const newWebservice = action.payload
                let fetchScriptsInterval = null
                const fetchAlive = pipelineAPI.fetchAlive()
                const fetchScripts = pipelineAPI.fetchScripts()
                fetchScriptsInterval = setInterval(() => {
                    if (selectStatus(getState()) == PipelineStatus.STOPPED) {
                        error(
                            'useWebservice',
                            'Pipeline has been stopped during webservice monitoring.',
                            'Please check pipeline logs.'
                        )
                        clearInterval(fetchScriptsInterval)
                    } else if (newWebservice) {
                        fetchAlive(newWebservice)
                            .then((alive) => {
                                dispatch(setAlive(alive))
                            })
                            .then(() => fetchScripts(newWebservice))
                            .then((scripts: Array<Script>) => {
                                info(
                                    'useWebservice',
                                    'Pipeline is ready to be used'
                                )
                                dispatch(setScripts(scripts))
                                dispatch(setStatus(PipelineStatus.RUNNING))
                                clearInterval(fetchScriptsInterval)
                                return pipelineAPI.fetchDatatypes()(
                                    newWebservice
                                )
                            })
                            .then((datatypes) => {
                                dispatch(setDatatypes(datatypes))
                                return pipelineAPI.fetchProperties()(
                                    newWebservice
                                )
                            })
                            .then((properties: EngineProperty[]) => {
                                // Note : here we merge the instance properties
                                // with the one extracted from settings
                                let settingsTtsProperties: EngineProperty[] =
                                    state.settings.ttsConfig.ttsEngineProperties.map(
                                        (p) => ({ name: p.key, value: p.value })
                                    )
                                for (const p of properties) {
                                    if (
                                        settingsTtsProperties.find(
                                            (p2) => p.name === p2.name
                                        ) === undefined
                                    ) {
                                        settingsTtsProperties.push(p)
                                    }
                                }
                                // dispatch to sync the properties
                                // in the engine
                                dispatch(setProperties(settingsTtsProperties))
                                return pipelineAPI.fetchTtsVoices(
                                    selectTtsConfig(getState())
                                )(newWebservice)
                            })
                            .then((voices: Array<TtsVoice>) => {
                                // console.log('TTS Voices', voices)
                                dispatch(setTtsVoices(voices))
                                return pipelineAPI.fetchTtsEnginesFeatures()(
                                    newWebservice
                                )
                            })
                            .then((features) => {
                                dispatch(setTtsEngineFeatures(features))
                            })
                            .catch((e) => {
                                error('useWebservice', e, e.parsedText)
                                if (
                                    selectStatus(getState()) ==
                                    PipelineStatus.RUNNING
                                ) {
                                    dispatch(setStatus(PipelineStatus.STOPPED))
                                }
                            })
                    }
                }, 1000)
                break
            case setScripts.type:
                for (const script of action.payload as Array<Script>) {
                    pipelineAPI
                        .fetchScriptDetails(script)()
                        .then((updated) => {
                            dispatch(updateScript(updated))
                        })
                        .catch((e) =>
                            error('error fetching script details', script, e)
                        )
                }
                break
            case setDatatypes.type:
                for (const datatype of action.payload as Array<Datatype>) {
                    pipelineAPI
                        .fetchDatatypeDetails(datatype)()
                        .then((updated) => {
                            dispatch(updateDatatype(updated))
                        })
                        .catch((e) =>
                            error(
                                'error fetching datatype details',
                                datatype,
                                e
                            )
                        )
                }
                break
            case removeJobs.type: // Batch removal of jobs in engine (no state check on removal)
                const removedJobs = action.payload as Job[]
                for (const jobToRemove of removedJobs) {
                    // Remove server-side job using API
                    if (jobToRemove.jobData && jobToRemove.jobData.href) {
                        const deleteJob = pipelineAPI.deleteJob(jobToRemove)
                        deleteJob().then((response) => {
                            console.log(
                                jobToRemove.jobData.jobId,
                                'delete response',
                                response.status,
                                response.statusText
                            )
                        })
                    }
                }
                break
            case removeJob.type:
                const visibleJobs = selectVisibleJobs(getState())
                const removedJob = action.payload as Job
                if (removedJob.jobRequest && !removedJob.invisible) {
                    // Ask delete confirmation for visible jobs deletion
                    const result = dialog.showMessageBoxSync(
                        MainWindowInstance,
                        {
                            message: `Are you sure you want to close this job ?`,
                            buttons: ['Yes', 'No'],
                        }
                    )
                    // Cancel action if no is selected
                    action = result === 1 ? null : action
                }
                // #41 : Handle removing the last visible job
                if (
                    action &&
                    visibleJobs.length === 1 &&
                    removedJob.internalId === visibleJobs[0].internalId
                ) {
                    // recreate a new job tab if the job closed was not empty
                    if (removedJob.jobRequest) {
                        dispatch(addJob(newJob(selectPipeline(state))))
                    } else {
                        // choice 1 : avoid deleting last job present
                        // action = null
                        // choice 2 : Close the window
                        if (MainWindowInstance != null) {
                            MainWindowInstance.close()
                        }
                    }
                }
                // Remove linked invisible jobs
                if (action && removedJob.linkedTo) {
                    const linkedInvisibleJob = currentJobs.find(
                        (j) =>
                            j.invisible && removedJob.linkedTo == j.internalId
                    )
                    if (linkedInvisibleJob)
                        dispatch(removeJob(linkedInvisibleJob))
                }
                if (action && removedJob.jobData && removedJob.jobData.href) {
                    // Remove server-side job using API
                    const deleteJob = pipelineAPI.deleteJob(removedJob)
                    deleteJob().then((response) => {
                        console.log(
                            removedJob.jobData.jobId,
                            'delete response',
                            response.status,
                            response.statusText
                        )
                    })
                }
                break
            case setProperties.type: // Update properties in the engine
                const newProperties = action.payload as EngineProperty[]
                let ttsEnginesStatesStart = {
                    ...(getState().pipeline.ttsEnginesStates as {
                        [key: string]: TtsEngineState
                    }),
                }
                //console.log('received new properties', newProperties)
                //console.log('tts states', ttsEnginesStatesStart)
                // for each new property, if the property is a TTS key or region
                // change the corresponding TTS engine state (pipeline.state.ttsEnginesStates)
                // to { connected = false, message = 'Connecting...' }
                for (const prop of newProperties) {
                    if (
                        prop.name.indexOf('.tts.') >= 0 &&
                        prop.name.indexOf('key') >= 0
                    ) {
                        const engineKey = prop.name.split('.').slice(-2)[0]
                        if (ttsEnginesStatesStart[engineKey] === undefined) {
                            if (prop.value === '') {
                                // empty key provided, no connection
                                ttsEnginesStatesStart[engineKey] = {
                                    status: 'disconnected',
                                    message: 'Disconnected',
                                }
                            } else {
                                ttsEnginesStatesStart[engineKey] = {
                                    status: 'connecting',
                                    message: 'Connecting...',
                                }
                            }
                        } else {
                            switch (ttsEnginesStatesStart[engineKey].status) {
                                case 'connected':
                                case 'connecting':
                                    if (prop.value === '') {
                                        // key removal
                                        ttsEnginesStatesStart[engineKey] = {
                                            status: 'disconnecting',
                                            message: 'Disconnecting...',
                                        }
                                    } else {
                                        // possible key or region change
                                        ttsEnginesStatesStart[engineKey] = {
                                            status: 'connecting',
                                            message: 'Reconnecting...',
                                        }
                                    }
                                    break
                                case 'disconnected':
                                case 'disconnecting':
                                default:
                                    if (prop.value !== '') {
                                        // new key provided for connection
                                        ttsEnginesStatesStart[engineKey] = {
                                            status: 'connecting',
                                            message: 'Connecting...',
                                        }
                                    }
                                    break
                            }
                        }
                    }
                }
                //console.log('tts states starting', ttsEnginesStatesStart)
                dispatch(setTtsEngineState(ttsEnginesStatesStart))
                Promise.all(
                    newProperties.map((prop) =>
                        pipelineAPI.setProperty(prop)(webservice)
                    )
                )
                    //.then(() => pipelineAPI.fetchProperties()(webservice))
                    .then(() => {
                        // If any of the properties updated is a TTS engine key
                        // property, reload voice list
                        if (
                            newProperties.find(
                                (p) =>
                                    p.name.indexOf('.tts.') >= 0 &&
                                    p.name.indexOf('key') >= 0
                            ) !== undefined
                        ) {
                            //console.log('reset voices')
                            pipelineAPI
                                .fetchTtsVoices(selectTtsConfig(getState()))(
                                    webservice
                                )
                                .then((voices: TtsVoice[]) => {
                                    dispatch(setTtsVoices(voices))
                                    let ttsEnginesStates = {
                                        ...(getState().pipeline
                                            .ttsEnginesStates as {
                                            [key: string]: TtsEngineState
                                        }),
                                    }
                                    // update working engines
                                    for (const voice of voices) {
                                        ttsEnginesStates[voice.engine] = {
                                            status: 'connected',
                                            message: 'Connected',
                                        }
                                    }
                                    // update non active expected engines
                                    for (const engineKey in ttsEnginesStates) {
                                        switch (
                                            ttsEnginesStates[engineKey].status
                                        ) {
                                            case 'connected':
                                            case 'disconnected':
                                                // success or no change
                                                break
                                            case 'disconnecting':
                                                // confirm disconnection
                                                ttsEnginesStates[engineKey] = {
                                                    status: 'disconnected',
                                                    message: 'Disconnected',
                                                }
                                            case 'connecting':
                                            default:
                                                // error case when trying to connect
                                                ttsEnginesStates[engineKey] = {
                                                    status: 'disconnected',
                                                    message:
                                                        'Could not connect to the engine, please check your credentials or the service status.',
                                                }
                                                break
                                        }
                                    }
                                    //console.log('tts states starting', ttsEnginesStates)
                                    dispatch(
                                        setTtsEngineState(ttsEnginesStates)
                                    )
                                    // Update features list
                                    return pipelineAPI.fetchTtsEnginesFeatures()(
                                        webservice
                                    )
                                })
                                .then((features) => {
                                    dispatch(setTtsEngineFeatures(features))
                                })
                        }
                    })
                break
            case runJob.type:
                // Launch the job with the API and start monitoring its execution
                // Also change its state to submited
                let runJobInterval = null
                const jobToRun = action.payload as Job
                // Empty previous references to jobData results for re run
                if (jobToRun.jobData && jobToRun.jobData.results) {
                    jobToRun.jobData.results = undefined
                }
                info('Launching job', JSON.stringify(jobToRun))
                const launchJobOn = pipelineAPI.launchJob(jobToRun)
                runJobInterval = setInterval(() => {
                    if (webservice) {
                        launchJobOn(webservice)
                            .then((jobResponse) => {
                                const updatedJob = {
                                    ...jobToRun,
                                    state: JobState.SUBMITTED,
                                } as Job
                                if (
                                    jobResponse.type == 'JobRequestError' ||
                                    jobResponse.type == 'JobUnknownResponse'
                                ) {
                                    updatedJob.jobRequestError =
                                        jobResponse as JobRequestError
                                } else {
                                    updatedJob.jobData = jobResponse as JobData
                                    // start a job monitor
                                    startMonitor(
                                        updatedJob,
                                        webservice,
                                        getState,
                                        dispatch
                                    )
                                }
                                clearInterval(runJobInterval)
                                dispatch(updateJob(updatedJob))
                            })
                            .catch((e) => {
                                clearInterval(runJobInterval)
                                error(
                                    'error launching job',
                                    jobToRun.internalId,
                                    e
                                )
                                dispatch(
                                    updateJob({
                                        ...jobToRun,
                                        jobData: {
                                            ...jobToRun.jobData,
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
                            })
                    }
                }, 1000)
                break
            case requestStylesheetParameters.type:
                const job = action.payload as Job
                pipelineAPI
                    .fetchStylesheetParameters(job)(webservice)
                    .then((parameters: ScriptOption[] | JobRequestError) => {
                        // check if parameters is of type JobRequestError
                        if ('type' in parameters) {
                            dispatch(
                                updateJob({
                                    ...job,
                                    jobData: {
                                        ...job.jobData,
                                        status: JobStatus.ERROR,
                                    },
                                    jobRequestError: parameters,
                                    errors: [
                                        {
                                            fieldName: 'stylesheet',
                                            error: parameters.description,
                                        },
                                    ],
                                })
                            )
                        } else {
                            // update job options with new parameters
                            const options = [...job.jobRequest.options]
                            for (let item of parameters) {
                                const existingOption = options.find(
                                    (o) => o.name === item.name
                                )
                                if (existingOption !== undefined) {
                                    existingOption.value = item.default
                                } else {
                                    // For now, only consider non-uri parameters
                                    options.push({
                                        name: item.name,
                                        value: item.default,
                                        isFile: false,
                                    })
                                }
                            }
                            // Also send back the parameters to the UI
                            // for composition of the script options
                            dispatch(
                                updateJob({
                                    ...job,
                                    jobRequest: {
                                        ...job.jobRequest,
                                        options: [...options],
                                    },
                                    stylesheetParameters: parameters,
                                })
                            )
                        }
                    })
                    .catch((e) => {
                        error('error fetching stylesheet parameters', e)
                        dispatch(
                            updateJob({
                                ...job,
                                jobData: {
                                    ...job.jobData,
                                    status: JobStatus.ERROR,
                                },
                                jobRequestError: {
                                    type: 'JobRequestError',
                                    description: String(e) + ':' + e.parsedText,
                                    trace: (e as Error).stack,
                                },
                                errors: [
                                    {
                                        fieldName: 'stylesheet',
                                        error:
                                            e instanceof ParserException
                                                ? e.parsedText
                                                : String(e),
                                    },
                                ],
                            })
                        )
                    })
                break
            default:
                if (action.type.startsWith('settings/')) {
                    // FIXME : check if local pipeline props have changed and
                    // if so, recreate a new pipeline instance from it using stop and start
                }
                break
        }
        if (action != null) return next(action)
    }
}
