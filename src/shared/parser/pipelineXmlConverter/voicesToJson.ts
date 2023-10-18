import { TtsVoice } from 'shared/types/ttsConfig'
import { parseXml } from './parser'
import { voiceElementToJson } from './voiceToJson'

function voicesToJson(xmlString: string): Array<TtsVoice> {
    try {
        let voicesElm = parseXml(xmlString, 'voices')
        let voices = Array.from(voicesElm.getElementsByTagName('voice')).map(
            (voiceElm: Element) => {
                return voiceElementToJson(voiceElm)
            }
        )
        return voices
    } catch (err) {
        return []
    }
}

export { voicesToJson }
