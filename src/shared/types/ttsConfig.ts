import { KeyValue } from './settings'

export type TtsVoice = {
    engine: string
    name: string
    lang: string
    gender: string
    priority?: number
    id?: string
    href: string
    preview: string
}

export type TtsConfig = {
    preferredVoices: Array<TtsVoice>
    defaultVoices: Array<TtsVoice>
    ttsEngineProperties: Array<KeyValue>
    xmlFilepath?: string
    ttsEnginesConnected: Object
}
export type _TtsConfig_v150 = {
    preferredVoices: Array<TtsVoice>
    defaultVoices: Array<TtsVoice>
    ttsEngineProperties: Array<KeyValue>
    xmlFilepath?: string
}

export type TtsEngineState = {
    status?: 'disabled' | 'connecting' | 'available' | 'disconnecting' | 'error'
    features?: Array<string>
    message?: string
    name?: string
    voicesUrl?: string
}
