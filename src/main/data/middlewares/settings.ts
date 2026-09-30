import { PayloadAction } from '@reduxjs/toolkit'
import { nativeTheme } from 'electron'
import { info, error } from 'electron-log'
import { writeFile, writeFileSync } from 'fs'
import {
    save,
    selectTtsConfig,
    setAutoCheckUpdate,
    setDownloadPath,
} from 'shared/data/slices/settings'
import { checkForUpdate } from 'shared/data/slices/update'
import { ttsConfigToXml } from 'shared/parser/pipelineXmlConverter/ttsConfigToXml'
import { RootState } from 'shared/types/store'
import { pipelineAPI } from '../apis/pipeline'
import {
    selectCanUseAdminEndpoints,
    selectWebservice,
} from 'shared/data/slices/pipeline'
import { settingsFile } from '../settings'
import { pathToFileURL } from 'url'
import { refreshTtsVoices } from './actions/webservice'

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
    return (next) => (action_: PayloadAction<any>) => {
        let action = action_
        // make sure we always store the download folder as a URL
        if (action.type == setDownloadPath.type) {
            action.payload = pathToFileURL(action.payload).href
        }

        let returnValue = next(action)
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
                    writeFileSync(
                        settingsFile,
                        JSON.stringify(settings, null, 4)
                    )
                    writeFile(
                        new URL(settings.ttsConfig.xmlFilepath),
                        ttsConfigToXml(settings.ttsConfig),
                        (err) => {
                            if (err) {
                                error(
                                    'settingsMiddleware',
                                    'Error writing TTS config XML file',
                                    err
                                )
                            }
                            const webservice = selectWebservice(getState())
                            let ttsConfig = selectTtsConfig(getState())
                            if (webservice) {
                                if (selectCanUseAdminEndpoints(getState())) {
                                    pipelineAPI
                                        .setTtsConfigProperty(ttsConfig)(
                                            webservice
                                        )
                                        .then(() => {
                                            refreshTtsVoices(
                                                webservice,
                                                dispatch,
                                                getState
                                            )
                                        })
                                        .catch((propertyErr) => {
                                            error(
                                                'settingsMiddleware',
                                                'Could not set TTS config property',
                                                propertyErr
                                            )
                                            refreshTtsVoices(
                                                webservice,
                                                dispatch,
                                                getState
                                            )
                                        })
                                } else {
                                    refreshTtsVoices(
                                        webservice,
                                        dispatch,
                                        getState
                                    )
                                }
                            }
                        }
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
