import { Voice } from 'shared/types/ttsConfig'
import { parseXml } from './parser'
import { voiceElementToJson } from './voiceToJson'

function voicesToJson(xmlString: string): Array<Voice> {
    let voicesElm = parseXml(xmlString, 'voices')
    let voices = Array.from(voicesElm.getElementsByTagName('voice')).map(
        (voiceElm: Element) => {
            return voiceElementToJson(voiceElm)
        }
    )
    return voices
}

export { voicesToJson }
