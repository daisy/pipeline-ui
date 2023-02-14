import { PayloadAction } from '@reduxjs/toolkit'
import { app, nativeTheme } from 'electron'
import { info } from 'electron-log'
import { existsSync, readFileSync, writeFile } from 'fs'
import { resolve } from 'path'
import { ENVIRONMENT } from 'shared/constants'
import { save } from 'shared/data/slices/settings'
import { ApplicationSettings, ColorScheme } from 'shared/types'
import { RootState } from 'shared/types/store'
import { resolveUnpacked } from 'shared/utils'
import { pathToFileURL } from 'url'

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
            }
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

/**
 * Middleware to save settings on disks on save request
 * @param param0
 * @returns
 */
export function settingsMiddleware({ getState }) {
    return (next) => (action: PayloadAction<any>) => {
        const returnValue = next(action)
        const { settings } = getState() as RootState
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
