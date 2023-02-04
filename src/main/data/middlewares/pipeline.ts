import {
    useWebservice,
    setScripts,
    setStatus,
    removeJob,
    runJob,
    updateJob,
    selectWebservice,
    selectStatus,
    start,
    stop,
} from 'shared/data/slices/pipeline'

import {
    Job,
    JobState,
    JobStatus,
    PipelineStatus,
    ResultFile,
    Webservice,
} from 'shared/types'

import { info, error } from 'electron-log'

import { pipelineAPI } from '../apis/pipeline'
import { PayloadAction } from '@reduxjs/toolkit'
import { saveFile, unzipFile } from 'main/factories/ipcs/file'
import {
    selectDownloadPath,
    selectPipelineProperties,
    selectSettings,
} from 'shared/data/slices/settings'
import { ParserException } from 'shared/parser/pipelineXmlConverter/parser'
import { PipelineInstance } from 'main/factories'
import { RootState } from 'shared/types/store'
import ElectronLog from 'electron-log'

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
        .fetchFile(r)()
        .then((buffer) =>
            r.mimeType === 'application/zip'
                ? unzipFile(buffer, targetUrl)
                : saveFile(buffer, targetUrl)
        )
        .then(() => {
            let newResult = Object.assign({}, r)
            newResult.file = targetUrl
            return newResult
        })
        .catch(() => r) // if a problem occured, return the original result
}

async function downloadJobResults(j: Job, targetFolder: string) {
    let copy = [...j.jobData.results.namedResults]
    let downloads: Array<Promise<ResultFile[]>> =
        j.jobData.results.namedResults.map((r) =>
            Promise.all(
                r.files.map((f) => {
                    // prettier-ignore
                    return downloadResultFile(
                        f,
                        new URL(
                            `${targetFolder}/${r.name}/${f.file.split('/').pop()}`
                        ).href
                    )
                })
            )
        )

    return Promise.all(downloads).then((downloadsByResults) => {
        downloadsByResults.forEach((namedResults, index) => {
            const newJobURL = new URL(`${targetFolder}/${copy[index].name}`)
                .href
            copy[index].href = newJobURL
            copy[index].files = downloadsByResults[index]
        })
        return {
            ...j,
            jobData: {
                ...j.jobData,
                downloadedFolder: targetFolder,
                results: {
                    ...j.jobData.results,
                    namedResults: [...copy],
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
        fetchJobData(ws)
            .then((value) => {
                console.log('received value ', value)
                if (
                    [
                        JobStatus.ERROR,
                        JobStatus.FAIL,
                        JobStatus.SUCCESS,
                    ].includes(value.status)
                ) {
                    // Job is finished, stop monitor
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
                        console.log()
                        dispatch(updateJob(downloadedJob))
                    })
                }
                dispatch(updateJob(j))
            })
            .catch((e) => {
                console.log('received error ', e)
                dispatch(
                    updateJob({
                        ...j,
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
        ElectronLog.error(e)
        return null
    }
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
        // Note NP : instead of doing the alive check, testing to directly check for scripts
        // and consider the pipeline alive as soon as we have the scripts list
        switch (action.type) {
            case start.type:
                getPipelineInstance(state)?.launch()
                break
            case stop.type:
                getPipelineInstance(state)?.stop(action.payload)
                break
            case useWebservice.type:
                let fetchScriptsInterval = null
                const fetchScripts = pipelineAPI.fetchScripts()
                fetchScriptsInterval = setInterval(() => {
                    if (action.payload) {
                        fetchScripts(action.payload)
                            .then((scripts) => {
                                dispatch(setScripts(scripts))
                                dispatch(setStatus(PipelineStatus.RUNNING))
                                clearInterval(fetchScriptsInterval)
                            })
                            .catch((e) => {
                                console.log('useWebservice', e)
                                if (
                                    selectStatus(state) ==
                                    PipelineStatus.RUNNING
                                ) {
                                    dispatch(setStatus(PipelineStatus.STOPPED))
                                }
                            })
                    }
                }, 1000)
                break
            case removeJob.type:
                // Delete the job folder from disk
                break
            case runJob.type:
                // Launch the job with the API and start monitoring its execution
                // Also change its state to submited
                let runJobInterval = null
                const jobToRun = action.payload as Job
                info('Launching job', JSON.stringify(jobToRun))
                const launchJobOn = pipelineAPI.launchJob(jobToRun)
                runJobInterval = setInterval(() => {
                    const webservice = selectWebservice(state)
                    if (webservice) {
                        launchJobOn(webservice)
                            .then((jobData) => {
                                const updatedJob = {
                                    ...jobToRun,
                                    state: JobState.SUBMITTED,
                                    jobData: jobData,
                                } as Job
                                dispatch(updateJob(updatedJob))
                                // start a job monitor
                                clearInterval(runJobInterval)
                                startMonitor(
                                    updatedJob,
                                    webservice,
                                    getState,
                                    dispatch
                                )
                            })
                            .catch((e) => {
                                error(
                                    'error launching job',
                                    jobToRun.internalId,
                                    e
                                )
                            })
                    }
                }, 1000)
                break
            default:
                if (action.type.startsWith('settings/')) {
                    // FIXME : check if local pipeline props have changed and
                    // if so, recreate a new pipeline instance from it using stop and start
                }
                break
        }
        return next(action)
    }
}
