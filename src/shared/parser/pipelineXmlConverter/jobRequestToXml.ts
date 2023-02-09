import { JobRequest } from 'shared/types/pipeline'

function jobRequestToXml(jobRequest: JobRequest): string {
    console.log(JSON.stringify(jobRequest, null, 2))
    
    let xmlString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <jobRequest xmlns="http://www.daisy.org/ns/pipeline/data">
    <nicename>${jobRequest.nicename}</nicename>
    <priority>medium</priority>
    <script href="${jobRequest.scriptHref}"/>
    ${jobRequest.inputs
        .filter((input) => input.value != null && input.value.trim() != '')
        .map(
            (input) =>
                `<input name="${input.name}"><item value="${
                    input.value.trim() ?? ''
                }"/></input>`
        )
        .join('')}
    ${jobRequest.options
        .filter((option) => option.value != null && option.value?.trim() != '')
        .map(
            (option) =>
                `<option name="${option.name}">${
                    option.value.trim() ?? ''
                }</option>`
        )
        .join('')}
  </jobRequest>`
    return xmlString
}

export { jobRequestToXml }
