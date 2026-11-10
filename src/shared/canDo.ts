import {
    Job,
    JobState,
    JobStatus,
    PipelineState,
    PipelineStatus,
    JobRequest,
} from './types'

// Whether every field of a job request passed validation.
// The validator marks empty optional fields as valid, so this covers both
// "required field is empty" and "a filled-in field has a bad value".
// Used for the Run button, the Run menu item, and the menu rebuild check
// so they always agree.
export function jobRequestIsValid(jobRequest: JobRequest | null | undefined) {
    return (jobRequest?.validation ?? []).every((v) => v.validValue)
}

// determine if actions should be enabled or not

export const CanDo = {
    // Returns whether job can be run
    runJob: (pipelineStatus: PipelineStatus, job: Job, downloadFolder) => {
        return (
            pipelineStatus == PipelineStatus.RUNNING &&
            job &&
            job.state == JobState.NEW &&
            job.jobRequest != null &&
            downloadFolder != '' &&
            jobRequestIsValid(job.jobRequest)
        )
    },

    // Returns whether job can be deleted
    deleteJob: canDeleteJob,

    // Returns whether job can be removed
    removeJob: (state: PipelineState, job: Job) => {
        return true
    },

    // Returns whether job can be closed
    closeJob: (state: PipelineState, job: Job) => {
        if (!job) {
            return false
        }
        if (job.jobData?.status) {
            let retval =
                [JobStatus.ERROR, JobStatus.FAIL, JobStatus.SUCCESS].includes(
                    job.jobData?.status
                ) || job.state == JobState.NEW
            return retval
        } else if (job.jobRequestError) {
            return true
        } else {
            return false
        }
    },

    // Returns whether a new job can be created
    createJob: (pipelineStatus: PipelineStatus) => {
        return pipelineStatus == PipelineStatus.RUNNING
    },

    // Returns whether job can be cancelled
    cancelJob: (state: PipelineState, job: Job) => {
        if (!state || !job) {
            return false
        }
        return (
            job.state == JobState.NEW || job.jobData?.status === JobStatus.IDLE
        )
    },

    // Returns whether job can be edited
    editJob: (
        state: PipelineState,
        pipelineStatus: PipelineStatus,
        job: Job
    ) => {
        if (job?.jobRequestError) return true
        return canDeleteJob(state, pipelineStatus, job)
    },
}

// helper function
function canDeleteJob(
    state: PipelineState,
    pipelineStatus: PipelineStatus,
    job: Job
) {
    return (
        pipelineStatus == PipelineStatus.RUNNING &&
        job &&
        (job.state == JobState.SUBMITTED || job.state == JobState.ENDED) &&
        job.jobData &&
        [JobStatus.SUCCESS, JobStatus.ERROR, JobStatus.FAIL].includes(
            job.jobData.status
        )
    )
}
