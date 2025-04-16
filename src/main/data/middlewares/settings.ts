import { PayloadAction } from '@reduxjs/toolkit'
import { nativeTheme } from 'electron'
import { info } from 'electron-log'
import { writeFile } from 'fs'
import {
    save,
    selectTtsConfig,
    setAutoCheckUpdate,
} from 'shared/data/slices/settings'
import { checkForUpdate } from 'shared/data/slices/update'
import { ttsConfigToXml } from 'shared/parser/pipelineXmlConverter/ttsConfigToXml'
import { EngineProperty } from 'shared/types'
import { RootState } from 'shared/types/store'
import { pipelineAPI } from '../apis/pipeline'
import { selectWebservice } from 'shared/data/slices/pipeline'
import { settingsFile } from '../settings'

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
                        () => {
                            //console.log("wrote file, setting engine property")
                            const webservice = selectWebservice(getState())
                            let ttsConfig = selectTtsConfig(getState())
                            let ttsConfigProperty: EngineProperty = {
                                name: 'org.daisy.pipeline.tts.config',
                                value: ttsConfig.xmlFilepath,
                            }
                            pipelineAPI.setProperty(ttsConfigProperty)(
                                webservice
                            )
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
