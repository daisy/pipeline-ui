import { PayloadAction } from '@reduxjs/toolkit'
import { pipelineAPI } from 'main/data/apis/pipeline'
import {
    selectWebservice,
    setTtsEngineState,
    setTtsVoices,
} from 'shared/data/slices/pipeline'
import { selectTtsConfig } from 'shared/data/slices/settings'
import { EngineProperty, TtsEngineState, TtsVoice } from 'shared/types'
import { GetStateFunction } from 'shared/types/store'

export function setProperties(
    action: PayloadAction<any>,
    dispatch,
    getState: GetStateFunction
) {
    const webservice = selectWebservice(getState())
    const newProperties = action.payload as EngineProperty[]
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
    let newProperties_ = newProperties.filter(
        (p) =>
            disconnectedEngines.filter((eId) => p.name.indexOf(eId) != -1)
                .length == 0
    )

    Promise.all(
        newProperties_.map((prop) => pipelineAPI.setProperty(prop)(webservice))
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
                                    case 'disabled':
                                        // success or no change
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

                        // console.log('tts states', states)
                        dispatch(setTtsEngineState(states))
                    })
            }
        })
}
