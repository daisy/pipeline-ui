import { CanDo } from './canDo'
import { selectPipeline } from './data/slices/pipeline'
import {
    Job,
    JobStatus,
    NameValue,
    PipelineState,
    Script,
    ScriptInput,
    ScriptItemBase,
} from './types'

// returns true if the script does not support sequences for input
// and is not a 2-steps script
export function isScriptBatchable(script: Script) {
    let hasSequenceForInput =
        script.inputs.find((input) => input.sequence === true) != undefined
    return !is2StepsScript(script) && !hasSequenceForInput
}

// return the first required input on the script
export function getFirstRequiredInput(script: Script): ScriptInput {
    let required = getAllRequired(script)
    if (required && required.length > 0) {
        return required[0] as ScriptInput
    } else {
        return null
    }
}

// update the array and return a new copy of it
export function updateArrayValue(
    value: any,
    data: ScriptItemBase,
    arr: NameValue[]
) {
    let arr2 = arr.map((i) => (i.name == data.name ? { ...i, value } : i))
    return arr2
}

// does the job request have multiple values for the input parameter marked 'batchable'?
export function hasBatchInput(job: Job): boolean {
    if (job.script.batchable) {
        let batchInput = getBatchInput(job.script)
        if (batchInput) {
            let batchInputInRequest = job.jobRequest.inputs.find(
                (input) => input.name == batchInput.name
            )
            return batchInputInRequest?.value?.length > 1
        }
        return false
    }
    return false
}
// get the first input listed as batchable
export function getBatchInput(script: Script): ScriptInput {
    if (script.batchable) {
        let batchInput = script.inputs.find((input) => input.batchable)
        return batchInput
    } else {
        return null
    }
}
export function getBatchInputValues(job: Job) {
    if (job.script.batchable) {
        let batchInput = getBatchInput(job.script)
        if (batchInput) {
            let batchInputInRequest = job.jobRequest.inputs.find(
                (input) => input.name == batchInput.name
            )
            return batchInputInRequest.value
        } else {
            return []
        }
    } else {
        return []
    }
}

export function is2StepsScript(script: Script) {
    if (!script || !script.options) {
        return false
    }
    return (
        script.options.findIndex(
            (item) => item.name == 'stylesheet-parameters'
        ) > -1
    )
}

export function getAllRequired(script: Script) {
    return script
        ? [
              ...script.inputs.filter((i) => i.required),
              ...script.options.filter((i) => i.required),
          ]
        : []
}

export function getAllOptional(script: Script) {
    return script
        ? [
              ...script.inputs.filter((i) => !i.required),
              ...script.options.filter((i) => !i.required),
          ]
        : []
}

export function areAllJobsInBatchDone(
    primaryJob: Job,
    jobsInBatch: Array<Job>
) {
    let numJobsDone = getCompletedCountInBatch(primaryJob, jobsInBatch)
    return numJobsDone == jobsInBatch?.length
}

export function getCompletedCountInBatch(
    primaryJob: Job,
    jobsInBatch: Array<Job>
) {
    if (jobsInBatch) {
        return (
            jobsInBatch.filter((j) =>
                [JobStatus.ERROR, JobStatus.FAIL, JobStatus.SUCCESS].includes(
                    j.jobData?.status
                )
            ).length + jobsInBatch.filter((j) => j.jobRequestError).length
        )
    }

    return 0
}

export function getIdleCountInBatch(primaryJob: Job, jobsInBatch: Array<Job>) {
    let numJobsIdle =
        jobsInBatch?.filter((j) => j.jobData.status == JobStatus.IDLE).length ??
        0
    return numJobsIdle
}

export function isScriptTTSEnhanced(script: Script) {
    let ttsInput = script.inputs.find((i) =>
        i.mediaType.includes('application/vnd.pipeline.tts-config+xml')
    )
    if (ttsInput) {
        return true
    } else {
        return false
    }
}

export function findInputType(type) {
    let inputType = ''
    if (['anyFileURI', 'anyDirURI'].includes(type)) {
        inputType = 'file'
    } else if (['xsd:dateTime', 'xs:dateTime', 'datetime'].includes(type)) {
        inputType = 'datetime-local'
    } else if (['xsd:boolean', 'xs:boolean', 'boolean'].includes(type)) {
        inputType = 'checkbox'
    } else if (['xsd:string', 'xs:string', 'string'].includes(type)) {
        inputType = 'text'
    } else if (
        ['xsd:integer', 'xs:integer', 'integer', 'number'].includes(type)
    ) {
        inputType = 'number'
    } else if (type == 'nonNegativeInteger') {
        inputType = 'nonNegativeInteger'
    } else if (['xsd:float', 'xsd:double', 'xsd:decimal'].includes(type)) {
        inputType = 'float'
    } else if (type == 'anyURI') {
        inputType = 'uri'
    } else if (type == '') {
        inputType = 'text'
    } else {
        inputType = 'custom'
    }
    return inputType
}

export function getJobsInBatch(state: PipelineState, job: Job) {
    if (!state.jobs || state.jobs.length == 0) {
        return []
    }
    if (!job) {
        return []
    }
    if (!job.jobRequest) {
        return []
    }
    if (job.jobRequest.batchId == null || job.jobRequest.batchId == '') {
        return []
    }

    let jobsInBatch = state.jobs.filter(
        (j) => j.jobRequest?.batchId == job.jobRequest.batchId
    )
    return jobsInBatch
}

export function closeOrCancelLabel(state: PipelineState, job: Job) {
    if (CanDo.closeJob(state, job)) {
        if (job?.jobRequest?.batchId) {
            return 'Close all jobs'
        } else {
            return 'Close job'
        }
    } else if (CanDo.cancelJob(state, job)) {
        if (job?.jobRequest?.batchId) {
            return 'Cancel scheduled jobs'
        } else {
            return 'Cancel job'
        }
    }
    return 'Cancel job'
}
