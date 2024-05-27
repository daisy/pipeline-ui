export type TtsVoice = {
    engine: string
    name: string
    lang: string
    gender: string
    priority?: number
    id?: string
}
export type TtsEngineProperty = {
    key: string
    value: string
}

export type TtsConfig = {
    preferredVoices: Array<TtsVoice>
    ttsEngineProperties: Array<TtsEngineProperty>
    xmlFilepath?: string
}

export type TtsEngineState = {
    status?: 'disabled' | 'connecting' | 'available' | 'disconnecting' | 'error'
    features?: Array<string>
    message?: string
}
