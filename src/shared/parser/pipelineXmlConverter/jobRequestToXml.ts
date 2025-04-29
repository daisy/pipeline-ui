import { JobRequest } from 'shared/types'

function jobRequestToXml(jobRequest: JobRequest): string {
    let xmlString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <jobRequest xmlns="http://www.daisy.org/ns/pipeline/data">
    <nicename>${jobRequest.nicename}</nicename>
    <priority>medium</priority>
    <script href="${jobRequest.scriptHref}"/>
    ${jobRequest.inputs
        .filter(
            (input) =>
                input.value != null && input.value.toString().trim() != ''
        )
        .map(
            (input) =>
                `<input name="${input.name}">${
                    Array.isArray(input.value)
                        ? input.value
                              .map(
                                  (value) =>
                                      `<item value="${
                                          convertValueIfPath(
                                              value,
                                              input.type
                                          ) ?? ''
                                      }"/>`
                              )
                              .join('')
                        : `<item value="${
                              input.value.toString().trim() ?? ''
                          }"/>`
                }</input>`
        )
        .join('')}
    ${jobRequest.options
        .filter(
            (option) =>
                option.value != null && option.value.toString().trim() != ''
        )
        .map(
            (option) =>
                `<option name="${option.name}">${
                    Array.isArray(option.value)
                        ? option.value
                              .map(
                                  (value) =>
                                      `<item value="${
                                          convertValueIfPath(
                                              value,
                                              option.type
                                          ) ?? ''
                                      }"/>`
                              )
                              .join('')
                        : option.value.toString().trim() ?? ''
                }</option>`
        )
        .join('')}
  </jobRequest>`
    return xmlString
}
function convertValueIfPath(value, type) {
    if (type == 'anyURI' || type == 'anyFileURI' || type == 'anyDirURI') {
        return value.toString().trim() // encodeURIComponent(value.toString().trim())
    } else {
        return value.toString().trim()
    }
}
export { jobRequestToXml }
