// usage data
// this is just a sketch right now, not being used

import { CpuInfo } from 'os'

export type UsageEntry = {
    submitted: boolean
    event: PipelineEventData
    timestamp: number
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

export type PipelineEventData = {
    eventName: string
}

// log this when the user runs a script
export type ScriptUsageEventData = PipelineEventData & {
    eventName: 'script-run'
    scriptId: string
    // optionOverrides: Array<OptionOverride>
    // tts?: TtsVoice
}

// log this when something has changed from the last SystemInfo entry (check on startup)
export type SystemInfoEventData = PipelineEventData & {
    eventName: 'system-info'
    systemProfile: SystemProfile
    appProfile: AppProfile
}

// TODO how do we define "override"?
/* it could be
 - not a script default value
 - not a user default value
 - not the presented default value (e.g. calculated based on what's available for that option)
*/
// export type OptionOverride = {
//     optionName: string
//     timesOverridden: number
// }

// export type TtsVoice = {
//     engine: string
//     voice: string
// }

