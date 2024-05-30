import { PayloadAction } from '@reduxjs/toolkit'
import { app, nativeTheme } from 'electron'
import { info, error } from 'electron-log'
import { existsSync, readFileSync, writeFile } from 'fs'
import { resolve } from 'path'
import { ENVIRONMENT } from 'shared/constants'
import { save, setAutoCheckUpdate } from 'shared/data/slices/settings'
import { checkForUpdate } from 'shared/data/slices/update'
import { ttsConfigToXml } from 'shared/parser/pipelineXmlConverter/ttsConfigToXml'
import {
    ApplicationSettings,
    EngineProperty,
    TtsEngineProperty,
    TtsVoice,
    migrateSettings,
} from 'shared/types'
import { RootState } from 'shared/types/store'
import { resolveUnpacked } from 'shared/utils'
import { fileURLToPath, pathToFileURL } from 'url'
import { pipelineAPI } from '../apis/pipeline'
import { selectWebservice, setTtsVoices } from 'shared/data/slices/pipeline'
import { propertyToXml } from 'shared/parser/pipelineXmlConverter/propertyToXml'

const settingsFile = resolve(app.getPath('userData'), 'settings.json')

export function readSettings() {
    let settings: ApplicationSettings = {
        settingsVersion: '1.4.0',
        downloadFolder: pathToFileURL(
            resolve(app.getPath('home'), 'Documents', 'DAISY Pipeline results')
        ).href,
        pipelineInstanceProps: {
            pipelineType: 'embedded',
            webservice: {
                // Notes :
                // - [49152 ; 65535] is the range of dynamic port,  0 is reserved for error case
                // - localhost resolve as ipv6 ':::' in nodejs, but we need ipv4 for the pipeline
                host: '127.0.0.1',
                port: 0,
                path: '/ws',
            },
            pipelineHome: resolveUnpacked('resources', 'daisy-pipeline'),
            jrePath: resolveUnpacked('resources', 'daisy-pipeline', 'jre'),
            appDataFolder: app.getPath('userData'),
            logsFolder: resolve(app.getPath('userData'), 'pipeline-logs'),
        },
        colorScheme: 'system',
        onClosingMainWindow: undefined, // Undeterminate to display the app-opening dialog
        editJobOnNewTab: true,
        ttsConfig: {
            preferredVoices: [],
            defaultVoices: [],
            xmlFilepath: pathToFileURL(
                resolve(app.getPath('userData'), 'ttsConfig.xml')
            ).href,
            ttsEngineProperties: [],
        },
        autoCheckUpdate: true,
    }
    try {
        if (existsSync(settingsFile)) {
            const loaded: ApplicationSettings = migrateSettings(
                JSON.parse(readFileSync(settingsFile, 'utf8'))
            )
            // NP 2024/04/25 : reset download folder on invalid url
            try {
                new URL(loaded.downloadFolder)
            } catch (e) {
                info(
                    'Invalid download folder URL in settings file',
                    'Falling back to default download folder'
                )
                loaded.downloadFolder = settings.downloadFolder
            }
            settings = {
                ...settings,
                ...loaded,
                pipelineInstanceProps: {
                    ...settings.pipelineInstanceProps,
                    ...loaded?.pipelineInstanceProps,
                    webservice: {
                        ...settings.pipelineInstanceProps.webservice,
                        ...loaded?.pipelineInstanceProps?.webservice,
                    },
                },
                ttsConfig: {
                    ...settings.ttsConfig,
                    ...loaded?.ttsConfig,
                    xmlFilepath: loaded?.ttsConfig?.xmlFilepath
                        ? loaded.ttsConfig.xmlFilepath.startsWith('file:')
                            ? loaded.ttsConfig.xmlFilepath
                            : pathToFileURL(loaded.ttsConfig.xmlFilepath).href
                        : settings.ttsConfig.xmlFilepath,
                },
            }
            info(`Settings loaded from ${settingsFile}`)
            info(JSON.stringify(settings))
        } else {
            error(`${settingsFile} not found`)
            throw new Error(`${settingsFile} not found`)
        }
        // Create the file if it does not exist
        // to ensure it is sent to pipeline
        const ttsConfigPath = fileURLToPath(settings.ttsConfig.xmlFilepath)
        if (!existsSync(ttsConfigPath)) {
            info(`Writing initial TTS Config file ${ttsConfigPath}`)
            writeFile(
                ttsConfigPath,
                ttsConfigToXml(settings.ttsConfig),
                () => {}
            )
        }
    } catch (e) {
        info('Error when trying to parse settings file')
        info(e)
        info('Falling back to default settings')
        info(JSON.stringify(settings, null, '  '))
    }

    // Remove pipeline props loading for dev
    if (ENVIRONMENT.IS_DEV) settings.pipelineInstanceProps = undefined

    return settings
}

function startCheckingUpdates(dispatch) {
    return setInterval(() => {
        dispatch(checkForUpdate())
    }, 20000)
}

/**
 * Middleware to save settings on disks on save request
 * and monitor for updates if autocheck is defined in settings
 * @param param0
 * @returns
 */
export function settingsMiddleware({ getState, dispatch }) {
    const initialSettings = (getState() as RootState).settings
    let updateCheckInterval = initialSettings.autoCheckUpdate
        ? startCheckingUpdates(dispatch)
        : null
    return (next) => (action: PayloadAction<any>) => {
        const returnValue = next(action)
        const { settings } = getState() as RootState

        // stop autoCheck action if it has been disabled
        if (!settings.autoCheckUpdate && updateCheckInterval !== null) {
            console.log('stop auto checking updates')
            clearInterval(updateCheckInterval)
            updateCheckInterval = null
        }
        if (settings.autoCheckUpdate && updateCheckInterval === null) {
            console.log('start auto checking updates')
            updateCheckInterval = startCheckingUpdates(dispatch)
        }

        try {
            switch (action.type) {
                case save.type:
                    // Parse new settings and dispatch updates if needed here
                    nativeTheme.themeSource = settings.colorScheme
                    writeFile(
                        settingsFile,
                        JSON.stringify(settings, null, 4),
                        () => {}
                    )
                    writeFile(
                        new URL(settings.ttsConfig.xmlFilepath),
                        ttsConfigToXml(settings.ttsConfig),
                        () => {}
                    )
                    break
                case setAutoCheckUpdate.type:
                    if (
                        action.payload === true &&
                        updateCheckInterval === null
                    ) {
                        info('start auto checking updates')
                        updateCheckInterval = startCheckingUpdates(dispatch)
                    }
                    if (
                        action.payload === false &&
                        updateCheckInterval !== null
                    ) {
                        info('stop auto checking updates')
                        clearInterval(updateCheckInterval)
                        updateCheckInterval = null
                    }
                    break
                default:
                    break
            }
        } catch (e) {
            console.log(e)
        }
        return returnValue
    }
}
