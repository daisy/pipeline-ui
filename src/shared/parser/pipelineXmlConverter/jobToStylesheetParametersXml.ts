import { Job } from 'shared/types'

/**
 * Media type to be used in the userAgentStylesheet tag
 *
 * "application/x-dtbook+xml" for dtbook-to-pef, dtbook-to-daisy3 and dtbook-to-epub3
 *
 * "application/xhtml+xml" for html-to-pef, epub3-to-pef, epub3-to-epub3 and epub-to-daisy
 *
 * "application/z3998-auth+xml" for zedai-to-epub3
 */
const ScriptMediaType = {
    'dtbook-to-pef': 'application/x-dtbook+xml',
    'dtbook-to-daisy3': 'application/x-dtbook+xml',
    'dtbook-to-epub3': 'application/x-dtbook+xml',
    'html-to-pef': 'application/xhtml+xml',
    'epub3-to-pef': 'application/xhtml+xml',
    'epub3-to-epub3': 'application/xhtml+xml',
    'epub-to-daisy': 'application/xhtml+xml',
    'zedai-to-epub3': 'application/z3998-auth+xml',
}

/**
 * media tag builders to be used in the request with the following per script values :
 * - "embossed AND (width:XXX) AND (height:XXX)" for "dtbook-to-pef", "html-to-pef" and "epub3-to-pef"
 * - "speech" for "dtbook-to-daisy3", "dtbook-to-epub3", "epub-to-daisy" and "zedai-to-epub3
 * - "braille, speech" or "braille" or "speech" for "epub3-to-epub3"
 */
const ScriptMediaTag = {
    'dtbook-to-pef': (j: Job) => {
        // braille script have width and height options to be used in a media tag
        const width = j.jobRequest.options.filter(
            (option) => option.name === 'page-width'
        )
        const height = j.jobRequest.options.filter(
            (option) => option.name === 'page-height'
        )
        return `<media value="embossed${
            width[0] !== undefined && ` AND (width:${width[0].value})`
        }${height[0] !== undefined && ` AND (height:${height[0].value})`}"/>`
    },
    'dtbook-to-daisy3': () => `<media value="speech"/>`,
    'dtbook-to-epub3': () => `<media value="speech"/>`,
    'html-to-pef': (j: Job) => {
        // braille script have width and height options to be used in a media tag
        const width = j.jobRequest.options.filter(
            (option) => option.name === 'page-width'
        )
        const height = j.jobRequest.options.filter(
            (option) => option.name === 'page-height'
        )
        return `<media value="embossed${
            width[0] !== undefined && ` AND (width:${width[0].value})`
        }${height[0] !== undefined && ` AND (height:${height[0].value})`}"/>`
    },
    'epub3-to-pef': (j: Job) => {
        // braille script have width and height options to be used in a media tag
        const width = j.jobRequest.options.filter(
            (option) => option.name === 'page-width'
        )
        const height = j.jobRequest.options.filter(
            (option) => option.name === 'page-height'
        )
        return `<media value="embossed${
            width[0] !== undefined && ` AND (width:${width[0].value})`
        }${height[0] !== undefined && ` AND (height:${height[0].value})`}"/>`
    },
    'epub3-to-epub3': (j: Job) => {
        console.log(j.jobRequest.options)
        const values = j.jobRequest.options
            .filter(
                (option) =>
                    (option.name === 'braille' && option.value === true) ||
                    (option.name === 'audio' && option.value === true) ||
                    (option.name === 'tts' && option.value !== 'false')
            )
            .map((option) => {
                if (option.name === 'braille') {
                    return 'braille'
                } else {
                    return 'speech'
                }
            })
            .join(', ')

        return `<media value="${values}"/>`
    },
    'epub-to-daisy': () => `<media value="speech"/>`,
    'zedai-to-epub3': () => `<media value="speech"/>`,
    'dtbook-to-ebraille': () => `<media value="braille"/>`,
}

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
    const scriptRef = j.script.id

    const stylesheet = j.jobRequest.options.filter(
        (option) => option.name === 'stylesheet'
    )[0]
    // Build request tags
    const mediaTag = ScriptMediaTag[scriptRef](j)
    let sourceDocument = `<sourceDocument>${j.jobRequest.inputs
        .filter(
            (input) =>
                input.value &&
                (input.type == 'anyURI' || input.type == 'anyFileURI') &&
                !input.name.endsWith('.scss')
        )
        .map((input) => `<file href="${input.value}"/>`)
        .join('')}</sourceDocument>`

    // workaround https://github.com/daisy/pipeline-ui/issues/198
    // we cannot send epub files, so source documents are discarded for epub* scripts
    if (scriptRef.startsWith('epub')) {
        sourceDocument = ''
    }
    const mimetype = `<userAgentStylesheet mediaType="${ScriptMediaType[scriptRef]}"/>`

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<parameters xmlns="http://www.daisy.org/ns/pipeline/data">
    ${mediaTag}
    ${mimetype}
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
