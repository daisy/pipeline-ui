import { PayloadAction } from '@reduxjs/toolkit'
import { app, nativeTheme } from 'electron'
import { info } from 'electron-log'
import { existsSync, readFileSync, writeFile } from 'fs'
import { resolve } from 'path'
import { ENVIRONMENT } from 'shared/constants'
import { save, setAutoCheckUpdate } from 'shared/data/slices/settings'
import { checkForUpdate } from 'shared/data/slices/update'
import { ttsConfigToXml } from 'shared/parser/pipelineXmlConverter/ttsConfigToXml'
import { ApplicationSettings, TtsVoice } from 'shared/types'
import { RootState } from 'shared/types/store'
import { resolveUnpacked } from 'shared/utils'
import { fileURLToPath, pathToFileURL } from 'url'
import { pipelineAPI } from '../apis/pipeline'
import { setTtsVoices } from 'shared/data/slices/pipeline'

const settingsFile = resolve(app.getPath('userData'), 'settings.json')

export function readSettings() {
    let settings = {
        // Default folder to download the results on the user disk
        downloadFolder: pathToFileURL(
            resolve(app.getPath('home'), 'Documents', 'DAISY Pipeline results')
        ).href,
        // Local pipeline server
        // - Run or not a local pipeline server
        runLocalPipeline: true,
        // - Local pipeline settings
        localPipelineProps: {
            localPipelineHome: resolveUnpacked('resources', 'daisy-pipeline'),
            jrePath: resolveUnpacked('resources', 'daisy-pipeline', 'jre'),
            // Note : [49152 ; 65535] is the range of dynamic port,  0 is reserved for error case
            webservice: {
                // Note : localhost resolve as ipv6 ':::' in nodejs, but we need ipv4 for the pipeline
                host: '127.0.0.1',
                port: 0,
                path: '/ws',
            },
            appDataFolder: app.getPath('userData'),
            logsFolder: resolve(app.getPath('userData'), 'pipeline-logs'),
        },
        // Remote pipeline settings
        // - Use a remote pipeline instead of the local one
        useRemotePipeline: false,
        // - Remote pipeline connection settings to be defined
        /*remotePipelineWebservice: {
            
        }*/
        colorScheme: 'system',
        appStateOnClosingMainWindow: undefined,
        jobsStateOnClosingMainWindow: 'close',
        ttsConfig: {
            preferredVoices: [],
            xmlFilepath: pathToFileURL(
                resolve(app.getPath('userData'), 'ttsConfig.xml')
            ).href,
            ttsEngineProperties: [],
        },
        autoCheckUpdate: true,
    } as ApplicationSettings
    try {
        if (existsSync(settingsFile)) {
            const loaded = JSON.parse(readFileSync(settingsFile, 'utf8'))
            settings = {
                ...settings,
                ...loaded,
                localPipelineProps: {
                    ...settings.localPipelineProps,
                    ...loaded?.localPipelineProps,
                    webservice: {
                        ...settings.localPipelineProps.webservice,
                        ...loaded?.localPipelineProps?.webservice,
                    },
                },
                ttsConfig: {
                    ...settings.ttsConfig,
                    ...loaded?.ttsConfig,
                    xmlFilepath: !loaded.xmlFilepath
                        ? settings.ttsConfig.xmlFilepath
                        : loaded.xmlFilepath.startsWith('file:')
                        ? loaded.xmlFilepath
                        : pathToFileURL(loaded.xmlFilepath).href,
                },
            }
        }
        // Create the file if it does not exist
        // to ensure it is sent to pipeline
        const ttsConfigPath = fileURLToPath(settings.ttsConfig.xmlFilepath)
        if (!existsSync(ttsConfigPath)) {
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
    }

    // Remove pipeline props loading for dev
    if (ENVIRONMENT.IS_DEV) settings.localPipelineProps = undefined

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
                    // re-fetch the /voices endpoint
                    pipelineAPI
                        .fetchTtsVoices()(
                            (getState() as RootState).pipeline.webservice
                        )
                        .then((voices: Array<TtsVoice>) => {
                            console.log('TTS Voices', voices)
                            dispatch(setTtsVoices(voices))
                        })
                    break
                case setAutoCheckUpdate.type:
                    if (
                        action.payload === true &&
                        updateCheckInterval === null
                    ) {
                        console.log('start auto checking updates')
                        updateCheckInterval = startCheckingUpdates(dispatch)
                    }
                    if (
                        action.payload === false &&
                        updateCheckInterval !== null
                    ) {
                        console.log('stop auto checking updates')
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
