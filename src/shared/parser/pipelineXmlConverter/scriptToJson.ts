import { Script, ScriptInput, ScriptOption } from 'shared/types'
import { parseXml } from './parser'
import { getFirstRequiredInput, isScriptBatchable } from 'shared/utils'

function scriptXmlToJson(xmlString: string): Script {
    let scriptElm = parseXml(xmlString, 'script')
    return scriptElementToJson(scriptElm)
}

function scriptElementToJson(scriptElm: Element): Script {
    let nicenameElm = scriptElm.getElementsByTagName('nicename')
    let descriptionElm = scriptElm.getElementsByTagName('description')
    let versionElm = scriptElm.getElementsByTagName('version')
    let homepageElm = scriptElm.getElementsByTagName('homepage')

    let script: Script = {
        id: scriptElm.getAttribute('id'),
        href: scriptElm.getAttribute('href'),
        nicename: (nicenameElm[0] as Element)?.textContent.trim() ?? '',
        description: (descriptionElm[0] as Element)?.textContent.trim() ?? '',
        version: (versionElm[0] as Element)?.textContent.trim() ?? '',
        homepage: (homepageElm[0] as Element)?.textContent.trim() ?? '',
        batchable: false,
        multidoc: false,
    }

    script.inputs = Array.from(scriptElm.getElementsByTagName('input')).map(
        (inputElm): ScriptInput => {
            let mediaType = []
            let mediaTypeVal = inputElm.getAttribute('mediaType')
            if (mediaTypeVal) {
                mediaType = mediaTypeVal.split(' ')
            }
            return {
                desc: inputElm.getAttribute('desc'),
                mediaType,
                name: inputElm.getAttribute('name'),
                sequence: inputElm.getAttribute('sequence') == 'true',
                required: inputElm.getAttribute('required') == 'true',
                nicename: inputElm.getAttribute('nicename'),
                type: 'anyFileURI',
                kind: 'input',
                ordered: false,
                isStylesheetParameter: false,
                batchable: false,
            }
        }
    )

    script.options = Array.from(scriptElm.getElementsByTagName('option')).map(
        (optionElm): ScriptOption => {
            let mediaType = []
            let mediaTypeVal = optionElm.getAttribute('mediaType')
            if (mediaTypeVal) {
                mediaType = mediaTypeVal.split(' ')
            }
            return {
                desc: optionElm.getAttribute('desc'),
                mediaType,
                name: optionElm.getAttribute('name'),
                sequence: optionElm.getAttribute('sequence') == 'true',
                required: optionElm.getAttribute('required') == 'true',
                nicename: optionElm.getAttribute('nicename'),
                ordered: optionElm.getAttribute('ordered') == 'true',
                type: optionElm.getAttribute('type'),
                default: optionElm.getAttribute('default'),
                kind: 'option',
                isStylesheetParameter: false,
            }
        }
    )

    // say whether the script is able to be batch-executed
    if (isScriptBatchable(script)) {
        script.batchable = true
        // scripts take one input right now
        script.inputs.map((input) => (input.batchable = true))
    }
    let firstRequiredInput = getFirstRequiredInput(script)
    if (firstRequiredInput?.sequence) {
        script.multidoc = true
    }

    return script
}

export { scriptXmlToJson, scriptElementToJson }
