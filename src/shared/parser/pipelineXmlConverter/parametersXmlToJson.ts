import { Job, ScriptOption } from 'shared/types'
import { parseXml } from './parser'

// Get new script options from a stylesheet parameters options
function parametersXmlToJson(xmlString: string): ScriptOption[] {
    let parametersElm = parseXml(xmlString, 'parameters')
    const result: ScriptOption[] = []
    for (const propElem of parametersElm.getElementsByTagName('parameter')) {
        const name = propElem.getAttribute('name')
        const value = propElem.getAttribute('default')
        const kind = propElem.getAttribute('type')
        const nicename = propElem.getAttribute('nicename')
        const description = propElem.getAttribute('description')
        result.push({
            desc: propElem.getAttribute('description'),
            name: propElem.getAttribute('name'),
            sequence: propElem.getAttribute('sequence') == 'true', // should always be false
            required: propElem.getAttribute('required') == 'true', // should always be false
            nicename: propElem.getAttribute('nicename'),
            ordered: propElem.getAttribute('ordered') == 'true', // should always be false
            type: propElem.getAttribute('type'),
            default: propElem.getAttribute('default'),
            kind: 'option',
        } as ScriptOption)
    }
    return result
}

export { parametersXmlToJson }
