// make an HTML-friendly ID string
export let ID = (id) => `z-${id}`

export function getRequiredInputs(script) {
    return (
        script.inputs
            .filter((item) => item.required)
            // inputs are always files (vs options)
            .map((item) => ({ ...item, type: 'anyFileURI', kind: 'input' }))
    )
}

export function getRequiredOptions(script) {
    return (
        script.options
            .filter((item) => item.required)
            // inputs are always files (vs options)
            .map((item) => ({ ...item, type: 'anyFileURI', kind: 'option' }))
    )
}

export function getOptionalInputs(script) {
    return (
        script.inputs
            .filter((item) => !item.required)
            // inputs are always files (vs options)
            .map((item) => ({ ...item, type: 'anyFileURI', kind: 'input' }))
    )
}

export function getOptionalOptions(script) {
    return (
        script.options
            .filter((item) => !item.required)
            // inputs are always files (vs options)
            .map((item) => ({ ...item, type: 'anyFileURI', kind: 'option' }))
    )
}

export function getAllRequired(script) {
    return [...getRequiredInputs(script), ...getRequiredOptions(script)]
}

export function getAllOptional(script) {
    return [...getOptionalInputs(script), ...getOptionalOptions(script)]
}

export function findValue(name, kind, jobRequest) {
    let arr = kind == 'input' ? jobRequest.inputs : jobRequest.options
    let item = arr.find((i) => i.name == name)
    return item?.value ?? ' '
}
