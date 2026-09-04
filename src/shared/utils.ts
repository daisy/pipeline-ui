import { CanDo } from './canDo'
import { selectPipeline } from './data/slices/pipeline'
import {
    ApplicationSettings,
    Job,
    NameValue,
    PipelineState,
    Script,
    ScriptInput,
    ScriptItemBase,
    ScriptOption,
} from './types'

export function parseGenderAge(raw: string = ''): {
    gender: string
    age?: string
} {
    const [rawGender, rawAge] = raw.trim().toLowerCase().split('-')
    if (rawGender === '*') {
        return { gender: 'unknown', age: 'unknown' }
    }

    const gender = rawGender || 'neutral'
    const age = rawAge || undefined

    return { gender, age }
}

export function formatGenderAgePart(value?: string): string {
    if (!value) {
        return '—'
    }

    const normalized = value === '*' ? 'unknown' : value
    return normalized.charAt(0).toUpperCase() + normalized.substring(1)
}

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
            (item) =>
                item.name == 'stylesheet-parameters' ||
                item.name == 'braille-translator-stylesheet-parameters'
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

export function closeOrCancelLabel(state: PipelineState, job: Job) {
    if (CanDo.closeJob(state, job)) {
        return 'Close job'
    } else if (CanDo.cancelJob(state, job)) {
        return 'Cancel job'
    }
    return 'Cancel job'
}

export function getStoredOptionValue(
    script: Script,
    option: ScriptOption,
    settings: ApplicationSettings
) {
    // see if there's a last-used value for this option in settings
    if (
        option.reusable &&
        settings &&
        settings.suggestOptionValues &&
        settings.lastUsedScriptOptionOverrides
    ) {
        let lastUsedValues = settings.lastUsedScriptOptionOverrides.find(
            (soo) => soo.scriptId == script.id
        )
        if (lastUsedValues) {
            // if current value is the default value for this script, see if there's an override
            let optionOverride = lastUsedValues.optionOverrides.find(
                (oo) => oo.name == option.name
            )
            if (optionOverride) {
                return optionOverride.value
            }
        }
    }
    return null
}

export function isJobUnchanged(
    job: Job,
    settings: ApplicationSettings
): boolean {
    if (job.script == null) return true
    if (!job.jobRequest) return true

    const allInputsEmpty = job.jobRequest.inputs.every((input) => {
        const v = input.value
        return v == null || (Array.isArray(v) && v.length === 0)
    })
    if (!allInputsEmpty) return false

    return job.jobRequest.options.every((option) => {
        const scriptOption = job.script.options?.find(
            (o) => o.name === option.name
        )
        if (!scriptOption) return true
        const initialValue =
            getStoredOptionValue(job.script, scriptOption, settings) ||
            scriptOption.default ||
            null
        return option.value === initialValue
    })
}
