import { JobRequest } from 'shared/types/pipeline'

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
                                          value.toString().trim() ?? ''
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
                                    value.toString().trim() ?? ''
                                }"/>`
                        )
                        .join('')
                        : option.value.toString().trim() ?? ''
                }</option>`
        )
        .join('')}
  </jobRequest>`
    console.log('JSON to XML result', xmlString)
    return xmlString
}

export { jobRequestToXml }
