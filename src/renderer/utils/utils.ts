import { JobRequest, Script } from 'shared/types'

// make an HTML-friendly ID string
export let ID = (id) => `z-${id}`

export function getAllRequired(script: Script) {
    return [
        ...script.inputs.filter((i) => i.required),
        ...script.options.filter((i) => i.required),
    ]
}

export function getAllOptional(script: Script) {
    return [
        ...script.inputs.filter((i) => !i.required),
        ...script.options.filter((i) => !i.required),
    ]
}

export function findValue(name: string, kind: string, jobRequest: JobRequest) {
    let arr = kind == 'input' ? jobRequest.inputs : jobRequest.options
    let item = arr.find((i) => i.name == name)
    return item?.value ?? ' '
}
