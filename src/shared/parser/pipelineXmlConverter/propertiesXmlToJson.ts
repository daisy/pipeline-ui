import { EngineProperty } from 'shared/types'
import { parseXml } from './parser'

function propertyElementToJson(prop: Element): EngineProperty | null {
    try {
        let newProp = {
            name: prop.getAttribute('name'),
            desc: prop.getAttribute('desc'),
            href: prop.getAttribute('href'),
            value: prop.getAttribute('value'),
        }
        return newProp
    } catch (err) {
        return null
    }
}

function propertiesXmlToJson(xmlString: string): Array<EngineProperty> {
    try {
        let propertiesElement = parseXml(xmlString, 'properties')
        return Array.from(
            propertiesElement.getElementsByTagName('property')
        ).map((propElem: Element) => propertyElementToJson(propElem))
    } catch (err) {
        return []
    }
}

export { propertyElementToJson, propertiesXmlToJson }
