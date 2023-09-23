import { Voice } from 'shared/types/pipeline'

function voiceElementToJson(voiceElm: Element): Voice {
    let voice: Voice = {
        name: voiceElm.getAttribute('name'),
        gender: voiceElm.getAttribute('gender'),
        lang: voiceElm.getAttribute('lang'),
        engine: voiceElm.getAttribute('engine'),
    }
    voice.id = `${voice.engine}-${voice.name}`
    return voice
}

export { voiceElementToJson }
