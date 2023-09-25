import { PipelineInstanceProps, Webservice } from './pipeline'
import { TtsConfig } from './ttsConfig'

export enum ColorScheme {
    system = 'System default mode',
    light = 'Light mode',
    dark = 'Dark mode',
}

export enum ClosingMainWindowActionForApp {
    keep = 'Keep running in the tray',
    close = 'Close the application',
    ask = 'Ask when closing window',
}

export enum ClosingMainWindowActionForJobs {
    keep = 'Keep all jobs opened',
    close = 'Close all non-running jobs',
}

export type ApplicationSettings = {
    // Default folder to download the results on the user disk
    downloadFolder?: string
    // Local pipeline server
    // - Run or not a local pipeline server
    runLocalPipeline?: boolean
    // - Local pipeline settings
    localPipelineProps?: PipelineInstanceProps
    // Remote pipeline settings
    // - Use a remote pipeline instead of the local one
    useRemotePipeline?: boolean
    // - Remote pipeline connection settings
    remotePipelineWebservice?: Webservice
    // Dark mode selector
    colorScheme: keyof typeof ColorScheme
    // Actions to perform when closing the main window
    appStateOnClosingMainWindow?: keyof typeof ClosingMainWindowActionForApp
    jobsStateOnClosingMainWindow?: keyof typeof ClosingMainWindowActionForJobs
    // tts preferred voices
    ttsConfig?: TtsConfig
}
