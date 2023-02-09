import { DOMParser } from '@xmldom/xmldom'

export class ParserException extends Error {
    parsedText: string
    constructor(message?: string, options?: ErrorOptions, parsedText?: string) {
        super(message, options)
        this.parsedText = parsedText
    }
}

// parse a string of xml and return the first element with the given name
export function parseXml(xmlString, elmName) {
    let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
    if (!doc) {
        throw new ParserException(
            `Could not parse the given string as XML (see parsedText field)`,
            null,
            xmlString
        )
    }
    let elm = doc.getElementsByTagName(elmName)
    if (!elm || elm.length == 0) {
        throw new ParserException(
            `Could not parse XML for ${elmName} (see parsedText field)`,
            null,
            xmlString
        )
    }
    return elm[0]
}
export function sniffRoot(xmlString) {
    if (!xmlString) return ''
    let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
    return doc.documentElement.tagName
}
