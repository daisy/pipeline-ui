import { readableStatus } from 'shared/jobName'
import { Job } from 'shared/types'

// this creates text for an aria-live region that is watched by screen readers and other AT
// the idea is to just announce status changes for the job on the current tab
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

    // job is on the selected tab
    if (job.internalId == selectedJobId) {
        announcement = statusAnnouncement
    }
    return announcement
}
