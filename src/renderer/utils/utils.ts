import { JobRequest } from 'shared/types'
import { readableStatus } from 'shared/jobName'

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


export function externalLinkClick(e, app) {
    e.preventDefault()
    let closest = e.target.closest('a')
    if (closest) {
        app.openInBrowser(closest.href)
    }
}

// get the first item in an array. if empty array, return empty string. if not actually array, return it.
export let getArr0 = (val) =>
    Array.isArray(val) ? (val.length > 0 ? val[0] : '') : val

export function getStatus(job) {
    if (job.jobRequestError) {
        return readableStatus.ERROR.toLowerCase()
    }
    if (job.jobData?.status) {
        return readableStatus[job.jobData.status].toLowerCase()
    }
    return readableStatus.LAUNCHING.toLowerCase()
}

export function valueIsNotEmpty(value) {
    if (!value) {
        return false
    }
    if (Array.isArray(value)) {
        return value.find((v) => v.trim() == '') == undefined
    }
    return value.trim() != ''
}
