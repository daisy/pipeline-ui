import { Job, JobState, JobStatus } from './types'

const readableStatus = {
    IDLE: 'Waiting',
    RUNNING: 'Running',
    ERROR: 'Error',
    SUCCESS: 'Completed',
    FAIL: 'Error',
}

function calculateJobName(job: Job) {
    let jobName =
        job?.jobData?.nicename ?? job?.jobRequest?.nicename ?? 'Untitled job'
    let jobStatus = ''
    if (job.state == JobState.NEW) {
        jobStatus = ''
    } else {
        jobStatus = readableStatus[job.jobData.status]
    }

    return `${jobName} ${jobStatus ? `(${jobStatus})` : ''}`
}


export { calculateJobName, readableStatus }
