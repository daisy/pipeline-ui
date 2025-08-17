import {
    JobRequest,
    NameValue,
    Script,
    ValidationInfo,
} from '../../shared/types'

// same as validateJobRequest except skips async operations e.g. check if file exists
export function validateJobRequestSync(jobRequest: JobRequest, script: Script) {
    let validationResults = []
    let validateField = (item: NameValue, required: boolean) => {
        let valueValidation = validateSync(item.type, item.value)
        validationResults.push({
            item,
            validValue: valueValidation.valid,
            message: valueValidation.message,
            required,
        })
    }
    for (let input of jobRequest.inputs) {
        let scriptInput = script.inputs?.find((i) => i.name == input.name)
        validateField(input, scriptInput.required)
    }
    for (let option of jobRequest.options) {
        let scriptOption = script.options?.find((o) => o.name == option.name)
        validateField(option, scriptOption.required)
    }
    return validationResults
}

export async function validateJobRequest(
    jobRequest: JobRequest,
    script: Script,
    App
): Promise<ValidationInfo[]> {
    let validationResults = []
    let validateField = async (item: NameValue, required: boolean) => {
        let valueValidation = await validateAsync(item.type, item.value, App)
        validationResults.push({
            item,
            validValue: valueValidation.valid,
            message: valueValidation.message,
            required,
        })
    }
    for (let input of jobRequest.inputs) {
        let scriptInput = script.inputs?.find((i) => i.name == input.name)
        await validateField(input, scriptInput.required)
    }
    for (let option of jobRequest.options) {
        let scriptOption = script.options?.find((o) => o.name == option.name)
        await validateField(option, scriptOption.required)
    }
    return validationResults
}

async function validateAsync(type, value, App) {
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
        let retval = validate(type, value)
        isValid = retval.valid
        message = retval.message
    }
    return { valid: isValid, message }
}

function validateSync(type, value) {
    let isValid = false
    let message = ''
    if (type == 'anyFileURI' || type == 'anyDirURI') {
        isValid = valueIsNotEmpty(value)
        if (!isValid) message = 'Value is empty.'
    } else {
        let retval = validate(type, value)
        isValid = retval.valid
        message = retval.message
    }
    return { valid: isValid, message }
}

// validates everything except anyFileURI and anyDirURI
function validate(type, value) {
    let isValid = false
    let message = ''
    if (['xsd:dateTime', 'xs:dateTime', 'datetime'].includes(type)) {
        let tmp = new Date(value)
        isValid = tmp.toString() != 'Invalid Date'
        if (!isValid) message = tmp.toString()
    } else if (['xsd:boolean', 'xs:boolean', 'boolean'].includes(type)) {
        isValid = typeof value === 'boolean'
        if (!isValid) message = `Boolean required (received ${typeof value})`
    } else if (['xsd:string', 'xs:string', 'string'].includes(type)) {
        isValid = typeof value === 'string' && value.trim() != ''
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
        isValid = true
    }
    return { valid: isValid, message }
}

function valueIsNotEmpty(value) {
    if (!value) {
        return false
    }
    if (Array.isArray(value)) {
        return value.find((v) => v.trim() == '') == undefined
    }
    return value.trim() != ''
}
