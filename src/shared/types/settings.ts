import { PipelineInstanceProps, Webservice } from './pipeline'

export enum ColorScheme {
    system = 'System default mode',
    light = 'Light mode',
    dark = 'Dark mode',
}

export enum ClosingMainWindowAction {
    keep = 'Keep running in the tray',
    close = 'Close the application',
    ask = 'Ask when closing window',
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
    onClosingMainWindows?: keyof typeof ClosingMainWindowAction
}
