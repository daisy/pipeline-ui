import { readableStatus } from 'shared/jobName'
import { Job } from 'shared/types'

// these functions may make good utilities
function getBatchIdOfJob(jobId, jobs: Array<Job>) {
    let job = jobs.find((j) => j.internalId == jobId)
    return job?.jobRequest?.batchId ?? null
}
// is the job in the given batch
function jobIsInBatch(jobId, batchId, jobs: Array<Job>) {
    let job = jobs.find((j) => j.internalId == jobId)
    return job.jobRequest.batchId && job.jobRequest.batchId == batchId
}

// this creates text for an aria-live region that is watched by screen readers and other AT
// the idea is to just announce status changes for the job on the current tab
// or in the case of batch jobs, the jobs on the current tab
export function createAnnouncement(
    job: Job,
    jobs: Array<Job>,
    selectedJobId
): string {
    let announcement = ''
    if (readableStatus[job.jobData.status] == undefined) {
        return ''
    }
    let statusAnnouncement = `Status: ${readableStatus[job.jobData.status]}`

    // if this job is part of a batch and that batch is on the selected tab
    if (
        job.jobRequest.batchId != null &&
        job.jobRequest.batchId == getBatchIdOfJob(selectedJobId, jobs)
    ) {
        let jobsInBatch = jobs.filter(
            (j) => j.jobRequest?.batchId == job.jobRequest?.batchId
        )
        let statuses = Array.from(
            new Set(jobsInBatch.map((j) => j.jobData.status))
        )
        statuses.sort((a, b) => (a < b ? -1 : 1))

        announcement = `Batch status ${statuses
            .map((s) => {
                let len = jobsInBatch.filter(
                    (j) => j.jobData.status == s
                ).length
                let jobOrJobs = len > 1 ? 'jobs' : 'job'
                return `${len} ${jobOrJobs} ${readableStatus[s]}`
            })
            .join(', ')}`
    }
    // not part of a batch
    else {
        // job is on the selected tab
        if (job.internalId == selectedJobId) {
            announcement = statusAnnouncement
        }
    }
    return announcement
}
