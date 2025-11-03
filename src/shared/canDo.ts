import {
    Job,
    JobState,
    JobStatus,
    PipelineState,
    PipelineStatus,
} from './types'
import {
    areAllJobsInBatchDone,
    getIdleCountInBatch,
    getJobsInBatch,
} from './utils'

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
        if (job.jobRequest && job.jobRequest?.batchId) {
            return areAllJobsInBatchDone(job, getJobsInBatch(state, job))
        } else if (job.jobData?.status) {
            let retval =
                [JobStatus.ERROR, JobStatus.FAIL, JobStatus.SUCCESS].includes(
                    job.jobData?.status
                ) || job.state == JobState.NEW
            return retval
        } else if (job.jobRequestError) {
            return true
            // } else if (job.state == JobState.NEW) {
            //     return true
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
        if (job?.jobRequest?.batchId) {
            return getIdleCountInBatch(job, getJobsInBatch(state, job)) > 0
        } else {
            return job.state == JobState.NEW
        }
    },

    // Returns whether job can be edited
    editJob: (
        state: PipelineState,
        pipelineStatus: PipelineStatus,
        job: Job
    ) => {
        return (
            canDeleteJob(state, pipelineStatus, job) &&
            (job.jobRequest.batchId == null || job.jobRequest.batchId == '')
        )
    },
}

// helper function
function canDeleteJob(
    state: PipelineState,
    pipelineStatus: PipelineStatus,
    job: Job
) {
    let jobsInBatch = getJobsInBatch(state, job)
    if (job?.isPrimaryForBatch) {
        return areAllJobsInBatchDone(job, jobsInBatch)
    } else {
        return (
            pipelineStatus == PipelineStatus.RUNNING &&
            job &&
            (job.state == JobState.SUBMITTED || job.state == JobState.ENDED) &&
            job.jobData &&
            job.jobData.status != JobStatus.RUNNING &&
            job.jobData.status != JobStatus.IDLE
        )
    }
}

// this was used in the menu but I think the version copied from the form (above) is better
// function canCloseJob(state: PipelineState, job: Job) {
//     if (job?.isPrimaryForBatch) {
//         return areAllJobsInBatchDone(job, getJobsInBatch(state, job))
//     } else {
//         return (
//             job &&
//             (job.state == JobState.SUBMITTED || job.state == JobState.ENDED)
//         )
//     }
// }
