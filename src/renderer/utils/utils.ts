import { JobRequest, Script } from 'shared/types'

// make an HTML-friendly ID string
export let ID = (id) => `z-${id}`

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

export function findValue(name: string, kind: string, jobRequest: JobRequest) {
    if (!jobRequest) return ''
    let arr = kind == 'input' ? jobRequest.inputs : jobRequest.options
    let item = arr.find((i) => i.name == name)
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
    if (['anyFileURI', 'anyDirURI', 'anyURI'].includes(type)) {
        inputType = 'file'
    } else if (['xsd:dateTime', 'xs:dateTime', 'datetime'].includes(type)) {
        inputType = 'datetime-local'
    } else if (['xsd:boolean', 'xs:boolean', 'boolean'].includes(type)) {
        inputType = 'checkbox'
    } else if (['xsd:string', 'xs:string', 'string'].includes(type)) {
        inputType = 'text'
    } else if (
        [
            'xsd:integer',
            'xsd:float',
            'xsd:double',
            'xsd:decimal',
            'xs:integer',
            'integer',
            'number',
        ].includes(type)
    ) {
        inputType = 'number'
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
