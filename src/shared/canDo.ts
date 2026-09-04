import {
    Job,
    JobState,
    JobStatus,
    PipelineState,
    PipelineStatus,
} from './types'

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
            job.jobRequest.validation.find(
                (v) => v.required && !v.validValue
            ) == undefined
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
