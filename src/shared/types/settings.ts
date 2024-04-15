import { PipelineInstanceProperties, Webservice } from './pipeline'
import { TtsConfig } from './ttsConfig'

export enum ColorScheme {
    system = 'System default mode',
    light = 'Light mode',
    dark = 'Dark mode',
}
export enum ClosingMainWindowAction {
    keepall = 'Keep all jobs opened with the application running in tray',
    keepengine = 'Close all jobs but keep the application running in tray',
    close = 'Quit the application',
    ask = 'Ask the preferred action on closing the window',
}

// Idea of evolutions :
// allow connection to multiple pipelines at the same time with an array of pipeline properties
// This could allow the calling of scripts from pipeline with different features enabled, like specific TTS systems (acapela or SAPI)

/**
 * 1.0.0
 * - Adding settingsVersion for upgrading
 * - Updated the pipeline instance properties
 * - Merged app and job actions on closing main window
 */
export type ApplicationSettings = {
    settingsVersion: '1.3.0'
    // Default folder to download the results on the user disk
    downloadFolder?: string
    // Pipeline instance properties for IPCs
    pipelineInstanceProps?: PipelineInstanceProperties
    // Dark mode selector
    colorScheme: keyof typeof ColorScheme
    // Actions to perform when closing the main window
    onClosingMainWindow?: keyof typeof ClosingMainWindowAction
    editJobOnNewTab?: boolean
    // tts preferred voices
    ttsConfig?: TtsConfig
    autoCheckUpdate?: boolean
}

export function migrateSettings(
    settings: ApplicationSettings | _ApplicationSettings_v0
): ApplicationSettings {
    // Take the content of the settings file
    // And apply migration process in order based on current settings version
    const migratorsKeys = Array.from(migrators.keys()).reverse()
    const lastMigrator = migratorsKeys.indexOf(settings['settingsVersion'])
    let newSettings = Object.assign({}, settings)
    for (const migratorVersionToApply of migratorsKeys.filter(
        (m, i) => i > lastMigrator
    )) {
        console.log('Migrating settings to version', migratorVersionToApply)
        newSettings = migrators.get(migratorVersionToApply)(newSettings)
    }
    return newSettings as ApplicationSettings
}

/**
 * Settings incremental migrators :
 * A migrator take the last-release setting type and update it to the newest
 * The migrator key should be the version targeted by the change
 * (For example, if we are updating settings for app version 1.0.0,
 * we should add a migrator with key '1.0.0' at the begining of the map)
 *
 * Always add the latest migrator at the begining of the map
 * (migrate use the first key as last iterator to apply )
 */
const migrators: Map<string, (prev: any) => any> = new Map<
    string,
    (prev: any) => any
>([
    // Insert new migrators here as [ 'version', (prev) => ApplicationSettings ]
    // Don't forget to update the settings class of previous migrators
    [
        '1.3.0',
        (prev: _ApplicationSettings_v0): ApplicationSettings => {
            const {
                // Removed, changed or renamed :
                runLocalPipeline,
                localPipelineProps,
                useRemotePipeline,
                remotePipelineWebservice,
                appStateOnClosingMainWindow,
                jobsStateOnClosingMainWindow,
                // remaining unchanged settings
                ...toKeep
            } = prev
            // changes in pipeline properties

            let localPipelineHome = undefined
            let prevPipelinePros = {}
            if (localPipelineProps) {
                let { localPipelineHome: temp, ..._prev } = localPipelineProps
                localPipelineHome = temp
                prevPipelinePros = _prev
            }

            return {
                settingsVersion: '1.3.0',
                downloadFolder: prev.downloadFolder,
                pipelineInstanceProps: {
                    pipelineType: 'embedded',
                    pipelineHome: localPipelineHome,
                    ...prevPipelinePros,
                },
                onClosingMainWindow:
                    appStateOnClosingMainWindow == undefined
                        ? undefined
                        : appStateOnClosingMainWindow == 'ask'
                        ? 'ask'
                        : appStateOnClosingMainWindow == 'close'
                        ? 'close'
                        : jobsStateOnClosingMainWindow == 'close'
                        ? 'keepengine'
                        : 'keepall',
                ...toKeep,
            } as ApplicationSettings
        },
    ],
])

/////// Keeping previous applications settings here for history and for migrators
/**
 * Initial version of settings
 */
type _ApplicationSettings_v0 = {
    // Default folder to download the results on the user disk
    downloadFolder?: string
    // Local pipeline server
    // - Run or not a local pipeline server
    runLocalPipeline?: boolean
    // - Local pipeline settings
    localPipelineProps?: {
        /**
         * optional path of the local installation of the pipeline,
         *
         * defaults to the application resources/daisy-pipeline
         */
        localPipelineHome?: string
        appDataFolder?: string
        logsFolder?: string
        /**
         * optional path to the java runtime
         *
         * defaults to the application resource/jre folder
         */
        jrePath?: string
        /**
         * Webservice configuration to use for embedded pipeline,
         *
         * defaults to a localhost managed configuration :
         * ```js
         * {
         *      host: "localhost"
         *      port: 0, // will search for an available port on the current host when calling launch() the first time
         *      path: "/ws"
         * }
         * ```
         *
         */
        webservice?: Webservice
        /**
         *
         */
        onError?: (error: string) => void
        onMessage?: (message: string) => void
    }
    // Remote pipeline settings
    // - Use a remote pipeline instead of the local one
    useRemotePipeline?: boolean
    // - Remote pipeline connection settings
    remotePipelineWebservice?: Webservice
    // Dark mode selector
    colorScheme: keyof typeof ColorScheme
    // Actions to perform when closing the main window
    appStateOnClosingMainWindow?: 'keep' | 'close' | 'ask'
    jobsStateOnClosingMainWindow?: 'keep' | 'close'
    // tts preferred voices
    ttsConfig?: TtsConfig
    autoCheckUpdate?: boolean
}
