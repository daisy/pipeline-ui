import {
    useWebservice,
    setScripts,
    setStatus,
    removeJob,
    runJob,
    updateJob,
    selectWebservice,
    selectStatus,
} from 'shared/data/slices/pipeline'

import {
    ApplicationSettings,
    baseurl,
    Job,
    JobData,
    JobState,
    JobStatus,
    NamedResult,
    PipelineStatus,
    ResultFile,
    Webservice,
} from 'shared/types'

import { pipelineAPI } from '../apis/pipeline'
import { PayloadAction } from '@reduxjs/toolkit'
import { saveFile, unzipFile } from 'main/factories/ipcs/file'
import { selectDownloadPath, selectSettings } from 'shared/data/slices/settings'
import { ParserException } from 'shared/parser/pipelineXmlConverter/parser'

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
                results: {
                    ...j.jobData.results,
                    namedResults: [...copy],
                },
            },
        } as Job
    })
}

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

/**
 * Middleware to fetch data from the pipeline
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
                console.log('runJob', jobToRun)
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
                                console.log('runJob error', e)
                            })
                    }
                }, 1000)
                break
        }
        return next(action)
    }
}