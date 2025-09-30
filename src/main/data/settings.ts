import { app } from 'electron'
import { info, error, debug } from 'electron-log'
import { existsSync, readFileSync, writeFile } from 'fs'
import { resolveUnpacked } from 'main/utils'
import { resolve } from 'path'
import { ENVIRONMENT } from 'shared/constants'
import { ttsConfigToXml } from 'shared/parser/pipelineXmlConverter/ttsConfigToXml'
import { ApplicationSettings, migrateSettings } from 'shared/types'
import { fileURLToPath, pathToFileURL } from 'url'

export const settingsFile = resolve(app.getPath('userData'), 'settings.json')

export function readSettings() {
    let settings: ApplicationSettings = {
        settingsVersion: '1.6.0',
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
                lastStart: 0,
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
            ttsEnginesConnected: [],
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
            if (ENVIRONMENT.IS_DEV) {
                debug(`Settings loaded from ${settingsFile}`)
                debug(JSON.stringify(settings))
            }
        } else {
            error(`${settingsFile} not found`)
            throw new Error(`${settingsFile} not found`)
        }
        // Create the file if it does not exist
        // to ensure it is sent to pipeline
        const ttsConfigPath = fileURLToPath(settings.ttsConfig.xmlFilepath)
        if (!existsSync(ttsConfigPath)) {
            info(`Writing initial TTS Config file ${ttsConfigPath}`)
            writeFile(ttsConfigPath, ttsConfigToXml(settings.ttsConfig), () => {
                // TODO send file path to pipeline (tts config property)
            })
        }
    } catch (e) {
        info('Error when trying to parse settings file')
        info(e)
        info('Falling back to default settings')
        info(JSON.stringify(settings, null, '  '))
    }

    // Remove pipeline props loading for dev
    //if (ENVIRONMENT.IS_DEV) settings.pipelineInstanceProps = undefined

    return settings
}
