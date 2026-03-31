import {
    EngineProperty,
    KeyValue,
    PipelineStatus,
    Script,
    Webservice,
} from 'shared/types'
import { info, error } from 'electron-log'
import { pipelineAPI } from '../../apis/pipeline'
import {
    selectStatus,
    setAlive,
    setDatatypes,
    setProperties,
    setScripts,
    setStatus,
} from 'shared/data/slices/pipeline'
import { save, setPipelineProperties } from 'shared/data/slices/settings'
import { getPipelineInstance } from '../../instance'
import { AbortError } from 'node-fetch'
import { GetStateFunction } from 'shared/types/store'
import { PayloadAction } from '@reduxjs/toolkit'

export function useWebservice(
    action: PayloadAction<any>,
    dispatch,
    getState: GetStateFunction
) {
    // Action dispatched when the pipeline instance is launched
    const newWebservice = action.payload as Webservice
    const fetchAlive = pipelineAPI.fetchAlive()
    const fetchScripts = pipelineAPI.fetchScripts()
    let maxAttempt = 2
    const loadPipelineData = async (attempt: number) => {
        if (attempt == maxAttempt) {
            error(
                'useWebservice',
                `${maxAttempt} attempts to fetch webservice data failed, stopping pipeline.`,
                'Please check pipeline logs.'
            )
            getPipelineInstance(getState())?.stop(action.payload)
            dispatch(setStatus(PipelineStatus.STOPPED))
            return
        }
        if (selectStatus(getState()) == PipelineStatus.STOPPED) {
            error(
                'useWebservice',
                'Pipeline has been stopped during webservice monitoring.',
                'Please check pipeline logs.'
            )
            return
        } else if (newWebservice) {
            fetchAlive(newWebservice)
                .then((alive) => {
                    info('useWebservice', 'Pipeline is ready to be used')
                    // Save the pipeline properties in settings
                    // and save settings
                    const { onError, onMessage, ...serializable } =
                        getPipelineInstance(getState()).props
                    dispatch(
                        setPipelineProperties({
                            ...serializable,
                            webservice: {
                                ...newWebservice,
                                lastStart: Date.now(),
                            },
                        })
                    )
                    dispatch(save())
                    dispatch(setAlive(alive))
                })
                // .then(() => pipelineAPI.fetchScripts()(newWebservice))
                .then(() => pipelineAPI.fetchProperties()(newWebservice))
                .then((properties: EngineProperty[]) => {
                    // Note : here we merge the instance properties
                    // with the one extracted from settings
                    let ttsSettingsProperties: Array<KeyValue> =
                        getState().settings.ttsConfig.ttsEngineProperties
                    let aiSettingsProperties: Array<KeyValue> =
                        getState().settings.aiEngineProperties
                    let settingsProperties: EngineProperty[] =
                        ttsSettingsProperties
                            .concat(aiSettingsProperties)
                            .map((p) => ({ name: p.key, value: p.value }))

                    for (const p of properties) {
                        if (
                            settingsProperties.find(
                                (p2) => p.name === p2.name
                            ) === undefined
                        ) {
                            settingsProperties.push(p)
                        }
                    }
                    // dispatch to sync the properties
                    // in the engine
                    // preserve the desc and href values too (they aren't part of settingsProperties)
                    let properties_ = settingsProperties.map((p) => {
                        let correspondingEngineProp = properties.find(
                            (pr) => pr.name == p.name
                        )
                        return {
                            ...p,
                            desc: correspondingEngineProp?.desc ?? '',
                            href: correspondingEngineProp?.href ?? '',
                        }
                    })
                    dispatch(
                        setProperties({ values: properties_, sendToAPI: false })
                    )
                    // For engines the user has explicitly disconnected, send
                    // empty credentials + enabled=false to prevent the engine
                    // from auto-reconnecting using its persisted state
                    const ttsEnginesConnected =
                        getState().settings.ttsConfig.ttsEnginesConnected
                    const ttsEngineProperties =
                        getState().settings.ttsConfig.ttsEngineProperties
                    const disconnectProps: EngineProperty[] = []
                    for (const [engineId, isConnected] of Object.entries(
                        ttsEnginesConnected
                    )) {
                        if (!isConnected) {
                            ttsEngineProperties
                                .filter((p) => p.key.startsWith(engineId))
                                .forEach((p) =>
                                    disconnectProps.push({
                                        name: p.key,
                                        value: '',
                                    })
                                )
                            disconnectProps.push({
                                name: engineId + '.enabled',
                                value: 'false',
                            })
                        }
                    }
                    if (disconnectProps.length > 0) {
                        dispatch(
                            setProperties({
                                values: disconnectProps,
                                sendToAPI: true,
                            })
                        )
                    }
                })
                .then(() => fetchScripts(newWebservice))
                .then((scripts: Array<Script>) =>
                    Promise.all(
                        scripts.map((s) => pipelineAPI.fetchScriptDetails(s)())
                    )
                )
                .then((scripts) => {
                    dispatch(setScripts(scripts))
                    return pipelineAPI.fetchDatatypes()(newWebservice)
                })
                .then((datatypes) =>
                    Promise.all(
                        datatypes.map((d) =>
                            pipelineAPI.fetchDatatypeDetails(d)()
                        )
                    )
                )
                .then((datatypes) => {
                    dispatch(setDatatypes(datatypes))
                })
                .then(() => {
                    info(`Pipeline is running`)
                    dispatch(setStatus(PipelineStatus.RUNNING))
                })
                .catch((e) => {
                    error('useWebservice', e, e.parsedText)
                    if (e instanceof AbortError) {
                        info(
                            `Trying for a new attempt ${attempt} / ${maxAttempt}`
                        )
                        loadPipelineData(attempt + 1)
                    } else if (
                        selectStatus(getState()) == PipelineStatus.RUNNING
                    ) {
                        error(
                            'useWebservice',
                            'Pipeline has stopped working during webservice monitoring.',
                            'Please check pipeline logs.'
                        )
                        dispatch(setStatus(PipelineStatus.STOPPED))
                    } else {
                        // Error during webservice check (possibly pipeline starting), retry in 1 second
                        setTimeout(() => loadPipelineData(0), 1000)
                    }
                })
        }
    }
    // Start pipeline data loading process
    loadPipelineData(0)
}
