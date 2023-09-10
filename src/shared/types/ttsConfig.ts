export type TtsVoice = {
    engine: string
    name: string
    lang: string
    gender: string
    priority: number
    id?: string
}

export type TtsConfig = {
    preferredVoices: Array<TtsVoice>
    xmlFilepath?: string
}
