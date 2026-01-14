// track usage data
import { CpuInfo } from 'os'

export type UsageData = {
    version: '1.0.0'
    appProfile: AppProfile
    systemProfile: SystemProfile
    scriptRuns: Array<ScriptRun>
}

export type AppProfile = {
    appVersion: string
    engineVersion: string
    locale: string
}

export type SystemProfile = {
    platform: string
    processors: Array<CpuInfo>
    totalmem: number
}

export type ScriptRun = {
    scriptId: string
    runs: number
    optionOverrides: Array<OptionOverride>
    tts?: TtsVoice
}

// TODO how do we define "override"?
/* it could be
 - not a script default value
 - not a user default value
 - not the presented default value (e.g. calculated based on what's available for that option)
*/
export type OptionOverride = {
    optionName: string
    timesOverridden: number
}

export type TtsVoice = {
    engine: string
    voice: string
}