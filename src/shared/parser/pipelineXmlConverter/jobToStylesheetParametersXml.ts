import { Job } from 'shared/types'

/**
 * Build a request xml string that can be sent to pipeline on the
 * "stylesheet-parameters" using the job inputs and the following
 * identified options :
 * - stylesheet
 * - page-width
 * - page-height
 * @param {Job} j the job to be used for building the xml
 * @returns {string} an xml string that can be sent to a DP2 engine to get
 * new script parameters
 */
function jobToStylesheetParametersXml(j: Job): string {
    const stylesheet = j.jobRequest.options.filter(
        (option) => option.name === 'stylesheet'
    )[0]
    const width = j.jobRequest.options.filter(
        (option) => option.name === 'page-width'
    )[0]
    const height = j.jobRequest.options.filter(
        (option) => option.name === 'page-height'
    )[0]
    let sourceDocument = `<sourceDocument>${j.jobRequest.inputs
        .filter(
            (input) =>
                input.value && input.isFile && !input.name.endsWith('.scss')
        )
        .map((input) => `<file href="${input.value}"/>`)
        .join('')}</sourceDocument>`
    
    // workaround https://github.com/daisy/pipeline-ui/issues/198
    if (j.jobRequest.scriptHref.includes('epub3-to-pef')) {
        sourceDocument = ''
    }
    
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<parameters xmlns="http://www.daisy.org/ns/pipeline/data">
    <media value="embossed AND (width:${width.value}) AND (height:${
        height.value
    })"/>
    <userStylesheets>${
        stylesheet && stylesheet.value
            ? Array.isArray(stylesheet.value)
                ? stylesheet.value
                      .map((v) => (v !== '' ? `<file href="${v}"/>` : ''))
                      .join('')
                : `<file href="${stylesheet.value}"/>`
            : ''
    }</userStylesheets>
    ${sourceDocument}
</parameters>`
}

export { jobToStylesheetParametersXml }
