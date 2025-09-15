import {
    Job,
    JobState,
    JobStatus,
    PipelineStatus,
    Webservice,
} from 'shared/types'
import { info, error } from 'electron-log'
import { pipelineAPI } from '../../apis/pipeline'
import { downloadJobLog, downloadJobResults } from './download'

import { selectDownloadPath } from 'shared/data/slices/settings'
import { updateJob, selectStatus } from 'shared/data/slices/pipeline'
import { ParserException } from 'shared/parser/pipelineXmlConverter/parser'
import { GetStateFunction } from 'shared/types/store'

import { WebSocket } from 'ws'
import { jobResponseXmlToJson } from 'shared/parser/pipelineXmlConverter/jobResponseToJson'
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
    const socket = new WebSocket(j.jobData.notificationsUrl)
    let fetchJobDataFn = pipelineAPI.fetchJobData(j)
    socket.addEventListener('message', async (event) => {
        // compare it against the fetch data
        const fetchData = await fetchJobDataFn(ws)
        let alertstr = (s) => `\n${s}******\n`
        // console.log(alertstr('FETCH'), fetchData, alertstr('FETCH'))
        // console.log(alertstr('WS'), event.data, alertstr('WS'))

        await processJobUpdate(j, getState, dispatch, fetchData)
    })

    socket.addEventListener('error', (err) => {
        error('Job monitoring failed', j)
    })
}

function processJobUpdate(
    j: Job,
    getState: GetStateFunction,
    dispatch,
    jobUpdateData: any
) {
    try {
        let parsedData = jobUpdateData //jobXmlToJson(jobUpdateData)
        
        let updatedJob = {
            ...j,
            jobData: parsedData,
        }
        const finished = [
            JobStatus.ERROR,
            JobStatus.FAIL,
            JobStatus.SUCCESS,
        ].includes(parsedData.status)
        if (finished) {
            updatedJob.state = JobState.ENDED
        }
        const newJobName = `${
            updatedJob.jobData.nicename ?? updatedJob.jobData.script.nicename
        }_${timestamp()}`
        const downloadFolder = selectDownloadPath(getState())

        if (updatedJob.jobData?.results?.namedResults) {
            // If job has results, download them
            downloadJobResults(updatedJob, `${downloadFolder}/${newJobName}`)
                .then((downloadedJob) => {
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
        } else if (finished) {
            info('job is finished without results')
            // job is finished wihout results : keep the log
            downloadJobLog(updatedJob, `${downloadFolder}/${newJobName}`).then(
                (jobWithLog) => {
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
