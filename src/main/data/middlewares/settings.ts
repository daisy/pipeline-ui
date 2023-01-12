import { app } from 'electron'
import { info } from 'electron-log'
import { existsSync, readFileSync, writeFile } from 'fs'
import { resolve } from 'path'
import { ApplicationSettings } from 'shared/types'
import { resolveUnpacked } from 'shared/utils'
import { pathToFileURL } from 'url'

const settingsFile = resolve(app.getPath('userData'), 'settings.json')

export function readSettings() {
    try {
        if (existsSync(settingsFile)) {
            return JSON.parse(readFileSync(settingsFile, 'utf8'))
        }
    } catch (e) {
        info('Error when trying to parse settings file')
        info(e)
        info('Falling back to default settings')
    }
    return {
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
    } as ApplicationSettings
}

/**
 * Middleware to save store and settings on disks
 * @param param0
 * @returns
 */
export function settingsMiddleware({ getState }) {
    return (next) => (action) => {
        const returnValue = next(action)
        const { settings } = getState()
        // Dedicated settings file
        if ((action.type as string).startsWith('settings')) {
            writeFile(settingsFile, JSON.stringify(settings, null, 4), () => {})
        }
        return returnValue
    }
}
