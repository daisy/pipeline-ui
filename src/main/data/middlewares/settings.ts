import { PayloadAction } from '@reduxjs/toolkit'
import { app, nativeTheme } from 'electron'
import { info } from 'electron-log'
import { existsSync, readFileSync, writeFile } from 'fs'
import { resolve } from 'path'
import { ENVIRONMENT } from 'shared/constants'
import { save, settings } from 'shared/data/slices/settings'
import { ApplicationSettings, migrateSettings } from 'shared/types'
import { RootState } from 'shared/types/store'
import { resolveUnpacked } from 'shared/utils'
import { pathToFileURL } from 'url'

const settingsFile = resolve(app.getPath('userData'), 'settings.json')

const initialState = settings.getInitialState()

export function readSettings() {
    let settings = Object.assign({}, {
        ...initialState,
        downloadFolder: pathToFileURL(
            resolve(app.getPath('home'), 'Documents', 'DAISY Pipeline results')
        ).href,
        pipelineInstanceProps: {
            ...initialState.pipelineInstanceProps,
            pipelineHome: resolveUnpacked('resources', 'daisy-pipeline'),
            jrePath: resolveUnpacked('resources', 'daisy-pipeline', 'jre'),
            appDataFolder: app.getPath('userData'),
            logsFolder: resolve(app.getPath('userData'), 'pipeline-logs'),
        },
        colorScheme: 'system',
    } as ApplicationSettings) as ApplicationSettings
    console.log('checking default : ', settings)
    try {
        if (existsSync(settingsFile)) {
            settings = migrateSettings(
                JSON.parse(readFileSync(settingsFile, 'utf8'))
            )
        }
        // Write the update settings file
        writeFile(settingsFile, JSON.stringify(settings, null, 4), () => {})
    } catch (e) {
        info('Error when trying to parse settings file')
        info(e)
        info('Falling back to default settings')
    }

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
