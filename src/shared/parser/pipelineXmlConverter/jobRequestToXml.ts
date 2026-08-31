import { JobRequest, NameValue } from 'shared/types'

export type JobRequestToXmlOptions = {
    pathMapper?: (value: string, item: NameValue) => string | undefined
}

function itemValueToXmlValue(
    value,
    item: NameValue,
    options?: JobRequestToXmlOptions
) {
    const convertedValue = convertValueIfPath(value, item.type) ?? ''
    return options?.pathMapper?.(convertedValue, item) ?? convertedValue
}

function jobRequestToXml(
    jobRequest: JobRequest,
    options?: JobRequestToXmlOptions
): string {
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
                                          itemValueToXmlValue(
                                              value,
                                              input,
                                              options
                                          ) ?? ''
                                      }"/>`
                              )
                              .join('')
                        : `<item value="${itemValueToXmlValue(
                              input.value,
                              input,
                              options
                          )}"/>`
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
                                          itemValueToXmlValue(
                                              value,
                                              option,
                                              options
                                          ) ?? ''
                                      }"/>`
                              )
                              .join('')
                        : itemValueToXmlValue(option.value, option, options)
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
