import { TtsVoice } from 'shared/types'

function voiceElementToJson(voiceElm: Element): TtsVoice {
    let voice: TtsVoice = {
        name: voiceElm.getAttribute('name'),
        gender: voiceElm.getAttribute('gender'),
        lang: voiceElm.getAttribute('lang'),
        engine: voiceElm.getAttribute('engine'),
        href: voiceElm.getAttribute('href'),
        preview: voiceElm.getAttribute('preview'),
    }
    voice.id = `${voice.engine}-${voice.name}`
    return voice
}

export { voiceElementToJson }
