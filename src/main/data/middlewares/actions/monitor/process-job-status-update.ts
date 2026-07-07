import { info, error } from 'electron-log'
import { Job, JobState, JobStatus } from 'shared/types'
import { selectDownloadPath } from 'shared/data/slices/settings'
import { updateJob } from 'shared/data/slices/pipeline'
import { ParserException } from 'shared/parser/pipelineXmlConverter/parser'
import { GetStateFunction } from 'shared/types/store'
import { pipelineAPI } from '../../../apis/pipeline'
import { downloadJobLog, downloadJobResults } from '../download'

export function processJobStatusUpdate(
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
        if (finished) {
            updatedJob.state = JobState.ENDED
        }
        const newJobName = `${
            updatedJob.jobData.nicename ??
            updatedJob.jobData.script?.nicename ??
            updatedJob.script?.nicename ??
            'Job'
        }_${timestamp()}`
        const downloadFolder = selectDownloadPath(getState())

        if (
            updatedJob.jobData?.results?.namedResults &&
            !updatedJob.resultsDownloaded
        ) {
            // If job has results, download them
            downloadJobResults(updatedJob, `${downloadFolder}/${newJobName}`)
                .then((downloadedJob) => {
                    downloadedJob.resultsDownloaded = true
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
            // job is finished wihout results : keep the log
            downloadJobLog(updatedJob, `${downloadFolder}/${newJobName}`).then(
                (jobWithLog) => {
                    jobWithLog.logDownloaded = true
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
