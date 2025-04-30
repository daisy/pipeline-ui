import { JobRequest, NameValue } from '../../shared/types'
/*
JobRequest
    scriptHref: string
    inputs?: Array<NameValue>
    options?: Array<NameValue>
    
*/
const { App } = window

export type JobRequestValidation = {
    item: NameValue
    valid: boolean
}

// // return a validated list of fields
export async function validateJobRequest(
    jobRequest: JobRequest
): Promise<JobRequestValidation[]> {
    let validationResults = []
    for (let input of jobRequest.inputs) {
        let valid = await validate(input.type, input.value)
        validationResults.push({
            item: input,
            valid,
        })
    }
    return validationResults
}

async function validate(type, value) {
    let isValid = false
    if (type == 'anyFileURI') {
        isValid = await App.isFile(value)
    } else if (type == 'anyDirURI') {
        isValid = await App.isDirectory(value)
    } else if (['xsd:dateTime', 'xs:dateTime', 'datetime'].includes(type)) {
        let tmp = new Date(value)
        isValid = tmp.toString() != 'Invalid Date'
    } else if (['xsd:boolean', 'xs:boolean', 'boolean'].includes(type)) {
        isValid = typeof value === 'boolean'
    } else if (['xsd:string', 'xs:string', 'string'].includes(type)) {
        isValid = typeof value === 'string'
    } else if (
        ['xsd:integer', 'xs:integer', 'integer', 'number'].includes(type)
    ) {
        isValid = typeof value === 'number'
    } else if (type == 'nonNegativeInteger') {
        isValid = typeof value === 'number' && value > 0
    } else if (['xsd:float', 'xsd:double', 'xsd:decimal'].includes(type)) {
        isValid = typeof value === 'number' // TODO
    } else if (type == 'anyURI') {
        // TODO
    } else if (type == '') {
        isValid = typeof value === 'string'
    } else {
        isValid = true
    }
    return isValid
}
