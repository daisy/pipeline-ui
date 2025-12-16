import {
    Datatype,
    JobRequest,
    NameValue,
    Script,
    ScriptInput,
    ScriptItemBase,
    ValidationInfo,
} from '../../shared/types'
import { findInputType } from 'shared/utils'
import { valueIsNotEmpty } from './utils'

// same as validateJobRequest except skips async operations e.g. check if file exists
export function validateJobRequestSync(
    jobRequest: JobRequest,
    script: Script,
    pipeline
) {
    let validationResults = []
    let validateField = (item: NameValue, field: ScriptItemBase) => {
        let required = field.required
        let valueValidation = validateSync(item.value, field.type, pipeline)
        validationResults.push({
            item,
            validValue: valueValidation.valid,
            message: valueValidation.message,
            required,
        })
    }
    for (let input of jobRequest.inputs) {
        let scriptInput = script.inputs?.find((i) => i.name == input.name)
        validateField(input, scriptInput)
    }
    for (let option of jobRequest.options) {
        let scriptOption = script.options?.find((o) => o.name == option.name)
        validateField(option, scriptOption)
    }
    return validationResults
}

export async function validateJobRequestAsync(
    jobRequest: JobRequest,
    script: Script,
    App,
    datatypes
): Promise<ValidationInfo[]> {
    let validationResults = []
    let validateField = async (item: NameValue, field: ScriptItemBase) => {
        let required = field.required
        let valueValidation = await validateAsync(
            item.value,
            field.type,
            App,
            datatypes
        )
        validationResults.push({
            item,
            validValue: valueValidation.valid,
            message: valueValidation.message,
            required,
        })
    }
    for (let input of jobRequest.inputs) {
        let scriptInput = script.inputs?.find((i) => i.name == input.name)
        await validateField(input, scriptInput)
    }
    for (let option of jobRequest.options) {
        let scriptOption = script.options?.find((o) => o.name == option.name)
        await validateField(option, scriptOption)
    }
    return validationResults
}

async function validateAsync(value, type, App, datatypes) {
    let isValid = false
    let message = ''
    if (type == 'anyFileURI') {
        if (Array.isArray(value)) {
            if (value.length == 0) isValid = false
            else {
                let retvals = []
                for (let v of value) {
                    let retval = await App.isFile(v)
                    retvals.push(retval)
                }
                isValid = retvals.find((v) => v == false) == undefined
            }
        } else {
            isValid = await App.isFile(value)
        }
        if (!isValid) message = 'File does not exist or is not a file.'
    } else if (type == 'anyDirURI') {
        if (Array.isArray(value)) {
            if (value.length == 0) isValid = false
            else {
                let retvals = []
                for (let v of value) {
                    let retval = await App.isDirectory(v)
                    retvals.push(retval)
                }
                isValid = retvals.find((v) => false) == undefined
            }
        } else {
            isValid = await App.isDirectory(value)
        }

        if (!isValid)
            message = 'Directory does not exist or is not a directory.'
    } else {
        let retval = validate(value, type, datatypes)
        isValid = retval.valid
        message = retval.message
    }
    return { valid: isValid, message }
}

function validateSync(value, type, datatypes) {
    let isValid = false
    let message = ''
    if (type == 'anyFileURI' || type == 'anyDirURI') {
        isValid = valueIsNotEmpty(value)
        if (!isValid) message = 'Value is empty.'
    } else {
        let retval = validate(value, type, datatypes)
        isValid = retval.valid
        message = retval.message
    }
    return { valid: isValid, message }
}

// validates everything except anyFileURI and anyDirURI
function validate(value, type, datatypes) {
    let isValid = false
    let message = ''
    if (!valueIsNotEmpty(value)) {
        isValid = false
    } else if (['xsd:dateTime', 'xs:dateTime', 'datetime'].includes(type)) {
        let tmp = new Date(value)
        isValid = tmp.toString() != 'Invalid Date'
        if (!isValid) message = tmp.toString()
    } else if (['xsd:boolean', 'xs:boolean', 'boolean'].includes(type)) {
        isValid =
            typeof value === 'boolean' ||
            (typeof value === 'string' &&
                (value.toLowerCase() == 'true' ||
                    value.toLowerCase() == 'false'))
        if (!isValid) message = `Boolean required (received ${typeof value})`
    } else if (['xsd:string', 'xs:string', 'string'].includes(type)) {
        isValid = typeof value === 'string'
        if (!isValid) message = `String required (received ${typeof value})`
    } else if (
        ['xsd:integer', 'xs:integer', 'integer', 'number'].includes(type)
    ) {
        if (typeof value === 'string') {
            try {
                parseInt(value)
                isValid = true
            } catch (err) {
                isValid = false
            }
        } else {
            isValid = typeof value === 'number'
        }
        if (!isValid) message = `Number required (received ${typeof value})`
    } else if (type == 'nonNegativeInteger') {
        isValid = typeof value === 'number' && value >= 0
        if (!isValid && typeof value !== 'number')
            message = `Non-negative number required (received ${typeof value})`
        if (!isValid && value < 0)
            message = 'Non-negative number required (received negative number)'
    } else if (['xsd:float', 'xsd:double', 'xsd:decimal'].includes(type)) {
        isValid = typeof value === 'number'
        if (!isValid) message = `Number required (received ${typeof value})`
    } else if (type == 'anyURI') {
        isValid = true // TODO
    } else {
        if (findInputType(type) == 'custom') {
            let datatype = datatypes.find((dt) => dt.id == type)
            isValid = validateCustom(value, datatype)
            if (!isValid) {
                message = `Invalid value. Please refer to the above description for allowed values.`
            }
        } else {
            isValid = true
        }
    }
    return { valid: isValid, message }
}
function validateCustom(value, datatype: Datatype) {
    if (!datatype) {
        return false
    }
    if (!value) {
        return false
    }
    let isValid = false
    // make sure value matches one of the allowed choices
    datatype.choices.map((dtChoice) => {
        if (dtChoice.hasOwnProperty('value')) {
            // @ts-ignore
            if (value == dtChoice.value) {
                isValid = true
            }
        } else if (dtChoice.hasOwnProperty('pattern')) {
            // @ts-ignore
            let pattern = dtChoice.pattern
            if (value.match(pattern)) {
                isValid = true
            }
        } else if (dtChoice.hasOwnProperty('type')) {
            // TODO what are the possible values for 'type' in this case?
        }
    })

    return isValid
}
