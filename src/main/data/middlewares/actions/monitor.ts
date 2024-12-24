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
    const fetchJobData = pipelineAPI.fetchJobData(j)
    const maxAttempt = 3
    const timeoutMonitor = async (attempt) => {
        if (attempt >= maxAttempt) {
            error(
                'Job monitoring failed after',
                maxAttempt,
                'attempts to fetch the job',
                j
            )
            return
        }
        const isFinished = await fetchJobData(ws)
            .then((value) => {
                // info('received job data ', value)
                // don't log the job messages, it's too verbose
                info('received job data ', {
                    ...value,
                    messages: ['removed to keep log cleaner'],
                })
                let updatedJob = {
                    ...j,
                    jobData: value,
                }
                const finished = [
                    JobStatus.ERROR,
                    JobStatus.FAIL,
                    JobStatus.SUCCESS,
                ].includes(value.status)
                if (finished) {
                    updatedJob.state = JobState.ENDED
                }
                const newJobName = `${
                    updatedJob.jobData.nicename ??
                    updatedJob.jobData.script.nicename
                }_${timestamp()}`
                const downloadFolder = selectDownloadPath(getState())
                if (updatedJob.jobData?.results?.namedResults) {
                    // If job has results, download them
                    downloadJobResults(
                        updatedJob,
                        `${downloadFolder}/${newJobName}`
                    )
                        .then((downloadedJob) => {
                            dispatch(updateJob(downloadedJob))
                            // Only delete job if it has been downloaded
                            if (downloadedJob.jobData.downloadedFolder) {
                                const deleteJob =
                                    pipelineAPI.deleteJob(downloadedJob)
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
                    downloadJobLog(
                        updatedJob,
                        `${downloadFolder}/${newJobName}`
                    ).then((jobWithLog) => {
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
                    })
                } else {
                    dispatch(updateJob(updatedJob))
                }
                return finished
            })
            .catch((e) => {
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
                if (j.jobRequestError) {
                    //clearInterval(monitor)
                    return true
                } else {
                    // relaunch a new attempt to get the job data
                    timeoutMonitor(attempt + 1)
                    return true // deativate the default monitor
                }
            })
        if (selectStatus(getState()) == PipelineStatus.STOPPED) {
            error('The pipeline has stopped working while executing job', j)
        }
        if (!isFinished) {
            // wait 1 sec before refetching if job is not in finished state
            setTimeout(() => timeoutMonitor(0), 1000)
        }
    }
    // Start the monitor
    timeoutMonitor(0)
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
