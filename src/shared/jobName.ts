import { Job, JobState, JobStatus } from './types'

const readableStatus = {
    LAUNCHING: 'Launching',
    IDLE: 'Waiting',
    RUNNING: 'Running',
    ERROR: 'Error',
    SUCCESS: 'Completed',
    FAIL: 'Fail',
}

function calculateJobName(job: Job, jobs: Array<Job>) {
    const jobRequestedName = job && job.jobRequest && job.jobRequest.nicename
    const jobDataName = job && job.jobData && job.jobData.nicename
    let jobName = jobRequestedName || jobDataName || 'Untitled job'
    let jobStatus = ''
    if (job.state == JobState.NEW) {
        jobStatus = ''
    } else {
        if (job.jobData.status) {
            jobStatus = readableStatus[job.jobData.status] ?? job.jobData.status
        }
        else {
            jobStatus = job.jobRequestError ? 'Error' : ''
        }
    }
    
    if (job.jobRequest?.batchId && job?.isPrimaryForBatch) {
        if (jobs) {
            let jobsInBatch = jobs.filter(
                (j) =>
                    j.jobRequest?.batchId &&
                    job.jobRequest?.batchId &&
                    j.jobRequest?.batchId ==
                        job.jobRequest?.batchId
            )
            let numJobsDone = jobsInBatch.filter((j) =>
                [JobStatus.ERROR, JobStatus.FAIL, JobStatus.SUCCESS].includes(
                    j.jobData.status
                )
            ).length
            return `${jobName} (${numJobsDone}/${jobsInBatch.length})`
        }
    } else {
        return `${jobName} ${jobStatus}`
    }
}


export { calculateJobName, readableStatus }
