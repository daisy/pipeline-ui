import { Job, JobState } from './types'

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
        } else {
            jobStatus = job.jobRequestError ? 'Error' : ''
        }
    }

    return `${jobName} ${jobStatus ? '-' : ''} ${jobStatus}`.trim()
}

export { calculateJobName, readableStatus }
