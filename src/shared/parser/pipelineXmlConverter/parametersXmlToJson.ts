import { Job, ScriptOption } from 'shared/types'
import { parseXml } from './parser'

// Get new script options from a stylesheet parameters options
function parametersXmlToJson(xmlString: string): ScriptOption[] {
    let parametersElm = parseXml(xmlString, 'parameters')
    const result: ScriptOption[] = []
    return Array.from(parametersElm.getElementsByTagName('parameter')).map(
        (propElem: any) =>
            ({
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
    )
}

export { parametersXmlToJson }
