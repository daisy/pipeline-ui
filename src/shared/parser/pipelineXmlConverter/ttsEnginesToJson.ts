import { parseXml } from './parser'

function ttsEnginesToJson(
    xmlString: string
): { [key: string]: Array<string> } | {} {
    try {
        let ttsEnginesElm = parseXml(xmlString, 'tts-engines')
        return Array.from(
            ttsEnginesElm.getElementsByTagName('tts-engine')
        ).reduce((acc, ttsEngineElem: Element) => {
            const key = ttsEngineElem.getAttribute('name')
            if (key) {
                acc[key] = ttsEngineElem.getAttribute('features')?.split(';')
            }
            return acc
        }, {})
    } catch (err) {
        return {}
    }
}

export { ttsEnginesToJson }
