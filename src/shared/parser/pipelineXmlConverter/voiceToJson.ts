import { TtsVoice } from 'shared/types'

function voiceElementToJson(voiceElm: Element): TtsVoice {
    return {
        name: voiceElm.getAttribute('name'),
        gender: voiceElm.getAttribute('gender'),
        lang: voiceElm.getAttribute('lang'),
        engine: voiceElm.getAttribute('engine'),
        preview: voiceElm.getAttribute('preview'),
    }
}

export { voiceElementToJson }
