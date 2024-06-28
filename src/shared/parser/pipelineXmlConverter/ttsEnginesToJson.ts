import { TtsEngineState } from 'shared/types'
import { parseXml } from './parser'

function ttsEnginesToJson(
    xmlString: string
): { [key: string]: TtsEngineState } | {} {
    try {
        let ttsEnginesElm = parseXml(xmlString, 'tts-engines')
        return Array.from(
            ttsEnginesElm.getElementsByTagName('tts-engine')
        ).reduce((acc, ttsEngineElem: Element) => {
            const key = ttsEngineElem.getAttribute('name')
            if (key) {
                acc[key] = {} as TtsEngineState
                if (ttsEngineElem.getAttribute('features').length > 0) {
                    acc[key].features = ttsEngineElem
                        .getAttribute('features')
                        ?.split(';')
                }
                if (ttsEngineElem.getAttribute('status').length > 0) {
                    acc[key].status = ttsEngineElem.getAttribute('status')
                }
                if (ttsEngineElem.getAttribute('message').length > 0) {
                    acc[key].message = ttsEngineElem.getAttribute('message')
                }
                if (ttsEngineElem.getAttribute('voices').length > 0) {
                    acc[key].voicesUrl = ttsEngineElem.getAttribute('voices')
                }
                if (ttsEngineElem.getAttribute('nicename').length > 0) {
                    acc[key].name = ttsEngineElem.getAttribute('nicename')
                }
            }
            return acc
        }, {})
    } catch (err) {
        return {}
    }
}

export { ttsEnginesToJson }
