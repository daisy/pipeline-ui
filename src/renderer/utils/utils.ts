import { JobRequest, Script } from 'shared/types'

// make an HTML-friendly ID string
export let ID = (id) => `z-${id}`

export function findValue(
    name: string,
    kind: string,
    jobRequest: JobRequest,
    isStylesheetParameter: boolean
) {
    if (!jobRequest) return ''
    let arr = null
    if (kind == 'input') {
        arr = jobRequest.inputs
    } else {
        if (isStylesheetParameter) {
            arr = jobRequest.stylesheetParameterOptions
        } else {
            arr = jobRequest.options
        }
    }
    // ensure there is a value for isStylesheetParameter
    arr.map(
        (item) =>
            (item.isStylesheetParameter = item.isStylesheetParameter ?? false)
    )
    let item = arr.find(
        (i) =>
            i.name == name && i.isStylesheetParameter == isStylesheetParameter
    )
    if (!item) return ''
    let value =
        // @ts-ignore
        item.value === true
            ? 'true'
            : // @ts-ignore
            item.value === false
            ? 'false'
            : item.value
    return value
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

export function externalLinkClick(e, app) {
    e.preventDefault()
    let closest = e.target.closest('a')
    if (closest) {
        app.openInBrowser(closest.href)
    }
}
