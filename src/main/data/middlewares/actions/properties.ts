import { PayloadAction } from '@reduxjs/toolkit'
import { pipelineAPI } from 'main/data/apis/pipeline'
import {
    selectCanUseAdminEndpoints,
    selectWebservice,
    selectProperties,
    selectScripts,
    setDatatypes,
    setScripts,
    setTtsEngineState,
    setTtsVoices,
    setOcrServicesState,
} from 'shared/data/slices/pipeline'
import { selectTtsConfig } from 'shared/data/slices/settings'
import {
    EngineProperty,
    OcrServiceState,
    TtsEngineState,
    TtsVoice,
} from 'shared/types'
import { GetStateFunction } from 'shared/types/store'

export function setProperties(
    action: PayloadAction<any>,
    dispatch,
    getState: GetStateFunction
) {
    if (action.payload.sendToAPI && !selectCanUseAdminEndpoints(getState())) {
        return
    }

    const webservice = selectWebservice(getState())
    const currentProperties = selectProperties(getState())
    const newProperties = action.payload.values as EngineProperty[]
    let ttsEnginesStatesStart = {
        ...(getState().pipeline.ttsEnginesStates as {
            [key: string]: TtsEngineState
        }),
    }
    //console.log('received new properties', newProperties)
    //console.log('tts states', ttsEnginesStatesStart)
    // for each new property, if the property is a TTS key or region
    // change the corresponding TTS engine state (pipeline.state.ttsEnginesStates)
    // to { connected = false, message = 'Connecting...' }
    for (const prop of newProperties) {
        if (prop.name.indexOf('.tts.') >= 0 && prop.name.indexOf('key') >= 0) {
            const engineKey = prop.name.split('.').slice(-2)[0]
            if (ttsEnginesStatesStart[engineKey] === undefined) {
                if (prop.value === '') {
                    // empty key provided, no connection
                    ttsEnginesStatesStart[engineKey] = {
                        status: 'disabled',
                        message: 'Disconnected',
                    }
                } else {
                    ttsEnginesStatesStart[engineKey] = {
                        status: 'connecting',
                        message: 'Connecting...',
                    }
                }
            } else {
                switch (ttsEnginesStatesStart[engineKey].status) {
                    case 'available':
                    case 'connecting':
                        if (prop.value === '') {
                            // key removal
                            ttsEnginesStatesStart[engineKey] = {
                                status: 'disconnecting',
                                message: 'Disconnecting...',
                            }
                        } else {
                            // possible key or region change
                            ttsEnginesStatesStart[engineKey] = {
                                status: 'connecting',
                                message: 'Reconnecting...',
                            }
                        }
                        break
                    case 'disabled':
                    case 'disconnecting':
                    default:
                        if (prop.value !== '') {
                            // new key provided for connection
                            ttsEnginesStatesStart[engineKey] = {
                                status: 'connecting',
                                message: 'Connecting...',
                            }
                        }
                        break
                }
            }
        }
    }
    //console.log('tts states starting', ttsEnginesStatesStart)
    dispatch(setTtsEngineState(ttsEnginesStatesStart))
    // remove properties for TTS engines that are disconnected
    let engineIds = Object.keys(
        getState().settings.ttsConfig.ttsEnginesConnected
    )
    let disconnectedEngines = engineIds.filter(
        (id) => !getState().settings.ttsConfig.ttsEnginesConnected[id]
    )
    let newProperties_ = action.payload.sendToAPI
        ? newProperties
        : newProperties.filter(
              (p) =>
                  disconnectedEngines.filter((eId) => p.name.indexOf(eId) != -1)
                      .length == 0
          )

    Promise.all(
        newProperties_.map((prop) => {
            const currProp = currentProperties[prop.name]
            if (currProp) {
                // preserve the desc and href data
                prop.desc = currProp.desc
                prop.href = currProp.href
            }
            if (action.payload.sendToAPI) {
                return pipelineAPI.setProperty(prop)(webservice)
            }
        })
    )
        //.then(() => pipelineAPI.fetchProperties()(webservice))
        .then(() => {
            // If voices list is not yet initialised
            // or any of the properties updated is a TTS engine key
            // property, reload voices list when properties are set
            if (
                getState().pipeline.ttsVoices == null ||
                newProperties.find(
                    (p) =>
                        p.name.indexOf('.tts.') >= 0 &&
                        p.name.indexOf('key') >= 0
                ) !== undefined
            ) {
                //console.log('reset voices')
                pipelineAPI
                    .fetchTtsVoices(selectTtsConfig(getState()))(webservice)
                    .then((voices: TtsVoice[]) => {
                        dispatch(setTtsVoices(voices))
                        let ttsEnginesStates = {
                            ...(getState().pipeline.ttsEnginesStates as {
                                [key: string]: TtsEngineState
                            }),
                        }
                        // update working engines
                        for (const voice of voices) {
                            ttsEnginesStates[voice.engine] = {
                                ...ttsEnginesStates[voice.engine],
                                status: 'available',
                                message: 'Connected',
                            }
                        }
                        // update non active expected engines
                        for (const engineKey in ttsEnginesStates) {
                            if (ttsEnginesStates[engineKey].status) {
                                switch (ttsEnginesStates[engineKey].status) {
                                    case 'available':
                                        // If engine was available but has no voices
                                        // in this fetch, it's no longer connected
                                        if (
                                            !voices.find(
                                                (v) => v.engine === engineKey
                                            )
                                        ) {
                                            ttsEnginesStates[engineKey] = {
                                                ...ttsEnginesStates[engineKey],
                                                status: 'disabled',
                                                message: '',
                                            }
                                        }
                                        break
                                    case 'disabled':
                                        // no change
                                        break
                                    case 'disconnecting':
                                        // confirm disconnection
                                        ttsEnginesStates[engineKey] = {
                                            ...ttsEnginesStates[engineKey],
                                            status: 'disabled',
                                            message: 'Disconnected',
                                        }
                                        break
                                    case 'connecting':
                                    default:
                                        // error case when trying to connect
                                        ttsEnginesStates[engineKey] = {
                                            ...ttsEnginesStates[engineKey],
                                            status: 'disabled',
                                            message:
                                                'Could not connect to the engine, please check your credentials or the service status.',
                                        }
                                        break
                                }
                            }
                        }
                        //console.log('tts states starting', ttsEnginesStates)
                        dispatch(setTtsEngineState(ttsEnginesStates))
                        // Re-update states from the engine itself
                        return pipelineAPI.fetchTtsEnginesState()(webservice)
                    })
                    .then((states) => {
                        // update the connectedness field based on whether the connection was successful
                        let ttsConfig_ = { ...getState().settings.ttsConfig }
                        let ttsEnginesConnected_ = {}
                        Object.keys(states).map(
                            (k) =>
                                (ttsEnginesConnected_[
                                    'org.daisy.pipeline.tts.' + k
                                ] = states[k].status == 'available')
                        )
                        ttsConfig_.ttsEnginesConnected = {
                            ...ttsEnginesConnected_,
                        }

                        // Normalize and filter states from the engine:
                        // - 'available' with no voices → downgrade to 'disabled'
                        // - Only dispatch terminal states to avoid intermediate
                        //   engine error messages flashing in the UI
                        Object.keys(states).forEach((k) => {
                            if (states[k].status === 'available') {
                                if (
                                    !getState().pipeline.ttsVoices?.some(
                                        (v) => v.engine === k
                                    )
                                ) {
                                    states[k].status = 'disabled'
                                    states[k].message = ''
                                } else if (!states[k].message) {
                                    states[k].message = 'Connected'
                                }
                            }
                        })
                        const terminalStates = Object.fromEntries(
                            Object.entries(states).filter(([, v]) =>
                                [
                                    'available',
                                    'disabled',
                                    'disconnected',
                                ].includes((v as TtsEngineState).status)
                            )
                        )
                        dispatch(setTtsEngineState(terminalStates))
                    })
            }
        })
        .then(async () => {
            const hasOcrProperties =
                newProperties.find((np) =>
                    np.name.startsWith('org.daisy.pipeline.ocr.')
                ) !== undefined
            // Refresh the OCR services status after the user changes OCR
            // properties, and once at startup (sendToAPI: false is the initial
            // sync; the engine got the properties at launch)
            if (
                BUILD_ENABLE_OCR &&
                (hasOcrProperties || !action.payload.sendToAPI)
            ) {
                await refreshOcrServicesStates(dispatch, getState, webservice)
            }
            if (action.payload.sendToAPI && hasOcrProperties) {
                const currentScripts = selectScripts(getState())
                const currentScriptIds = new Set(
                    currentScripts.map((s) => s.id)
                )
                const fetchScripts = pipelineAPI.fetchScripts()
                for (let i = 0; i < 10; i++) {
                    await new Promise((r) => setTimeout(r, 300))
                    const scripts = await fetchScripts(webservice)
                    if (
                        scripts.length !== currentScripts.length ||
                        scripts.some((s) => !currentScriptIds.has(s.id))
                    ) {
                        const newScripts = scripts.filter(
                            (s) => !currentScriptIds.has(s.id)
                        )
                        const newDetailed = await Promise.all(
                            newScripts.map((s) =>
                                pipelineAPI.fetchScriptDetails(s)()
                            )
                        )
                        // follow the engine's list both ways: drop scripts it
                        // no longer lists (e.g. an OCR script after disconnecting)
                        // and keep the details already loaded for the others
                        const listedIds = new Set(scripts.map((s) => s.id))
                        dispatch(
                            setScripts([
                                ...selectScripts(getState()).filter((s) =>
                                    listedIds.has(s.id)
                                ),
                                ...newDetailed,
                            ])
                        )
                        const currentDatatypeIds = new Set(
                            getState().pipeline.datatypes.map((d) => d.id)
                        )
                        const datatypes =
                            await pipelineAPI.fetchDatatypes()(webservice)
                        const newDatatypes = datatypes.filter(
                            (d) => !currentDatatypeIds.has(d.id)
                        )
                        const newDetailedDatatypes = await Promise.all(
                            newDatatypes.map((d) =>
                                pipelineAPI.fetchDatatypeDetails(d)()
                            )
                        )
                        if (newDetailedDatatypes.length > 0) {
                            dispatch(
                                setDatatypes([
                                    ...getState().pipeline.datatypes,
                                    ...newDetailedDatatypes,
                                ])
                            )
                        }
                        return
                    }
                }
            }
        })
}

/**
 * Ask the engine whether each OCR service works with the current properties
 * (it checks the API key with the service) and store the result.
 */
async function refreshOcrServicesStates(
    dispatch,
    getState: GetStateFunction,
    webservice
) {
    let states: { [key: string]: OcrServiceState } | null = null
    try {
        states = await pipelineAPI.fetchOcrServicesState()(webservice)
    } catch (e) {
        states = null
    }
    if (states) {
        dispatch(setOcrServicesState(states))
        return
    }
    // The engine couldn't be asked (request failed, or an engine without the
    // /ocr/services endpoint): don't leave services stuck on "Connecting...".
    const current = getState().pipeline.ocrServicesStates ?? {}
    const unsettled: { [key: string]: OcrServiceState } = {}
    for (const key of Object.keys(current)) {
        if (['connecting', 'disconnecting'].includes(current[key].status)) {
            unsettled[key] = {
                status: 'error',
                message: 'Could not check the connection status',
            }
        }
    }
    if (Object.keys(unsettled).length > 0) {
        dispatch(setOcrServicesState(unsettled))
    }
}
