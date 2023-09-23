export type Voice = {
    engine: string
    name: string
    lang: string
    gender: string
    priority?: number
    id?: string
}

export type TtsConfig = {
    preferredVoices: Array<Voice>
    xmlFilepath?: string
}
