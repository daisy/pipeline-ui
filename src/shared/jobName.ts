import { Job, JobState, JobStatus } from './types'

const readableStatus = {
    IDLE: 'Waiting',
    RUNNING: 'Running',
    ERROR: 'Error',
    SUCCESS: 'Completed',
    FAIL: 'Error',
}

function calculateJobName(job: Job) {
    const jobRequestedName = job && job.jobRequest && job.jobRequest.nicename
    const jobDataName = job && job.jobData && job.jobData.nicename
    let jobName = jobRequestedName || jobDataName || 'Untitled job'
    let jobStatus = ''
    if (job.state == JobState.NEW) {
        jobStatus = ''
    } else {
        jobStatus = readableStatus[job.jobData.status]
    }

    return `${jobName} ${jobStatus ? `(${jobStatus})` : ''}`
}

export { calculateJobName, readableStatus }
