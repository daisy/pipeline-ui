/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { PipelineAPI } from 'shared/data/apis/pipeline'
import { selectTtsVoices, setTtsVoices } from 'shared/data/slices/pipeline'
import { TtsVoice } from 'shared/types/ttsConfig'

const enginePropertyKeys = [
    'org.daisy.pipeline.tts.azure.key',
    'org.daisy.pipeline.tts.azure.region',
    'org.daisy.pipeline.tts.google.apikey',
]
const engineNames = {
    'org.daisy.pipeline.tts.azure': 'Azure',
    'org.daisy.pipeline.tts.google': 'Google',
}

const pipelineAPI = new PipelineAPI(
    (url, ...args) => window.fetch(url, ...args),
    console.info
)

const { App } = window

// Clone operation to ensure the full array is copied and avoid
// having array of references to object we don't want to change
const clone = (propsArray: Array<{ key: string; value: string }>) => [
    ...propsArray.map((kv) => ({ key: kv.key, value: kv.value })),
]

export function TtsEnginesConfigPane({
    ttsEngineProperties,
    onChangeTtsEngineProperties,
}) {
    const { pipeline } = useWindowStore()
    console.log('TTS engine props', ttsEngineProperties)
    // Clone array and objects in it to avoid updating the oriiginal props
    const [engineProperties, setEngineProperties] = useState<
        Array<{ key: string; value: string }>
    >(clone(ttsEngineProperties))

    const [engineMessage, setEngineMessage] = useState<{
        [engineKey: string]: string
    }>({})

    const [enginePropsChanged, setEnginePropsChanged] = useState<{
        [engineKey: string]: boolean
    }>({})

    let onPropertyChange = (e, propName) => {
        e.preventDefault()
        let engineProperties_ = clone(engineProperties)
        let prop = engineProperties_.find((prop) => prop.key == propName)
        if (prop) {
            prop.value = e.target.value
        } else {
            let newProp = {
                key: propName,
                value: e.target.value.trim(),
            }
            engineProperties_.push(newProp)
        }
        // Search for updates compared to original props
        let realProp = (ttsEngineProperties || []).find(
            (prop) => prop.key == propName
        )
        const engineKey = propName.split('.').slice(0, 5).join('.')
        setEngineMessage({
            ...engineMessage,
            [engineKey]: null,
        })
        setEnginePropsChanged({
            ...enginePropsChanged,
            [engineKey]:
                realProp == undefined ||
                (realProp && realProp.value != prop.value),
        })
        setEngineProperties([...engineProperties_])
    }

    const isConnectedToTTSEngine = (engineKey: string) => {
        return (
            selectTtsVoices(App.store.getState()).filter(
                (v) => v.engine == engineKey.split('.').slice(-1)[0]
            ).length > 0
        )
    }

    const connectToTTSEngine = (engineKey: string) => {
        const ttsProps = [
            ...engineProperties.filter((k) => k.key.startsWith(engineKey)),
        ]
        // Reset message or error for the engine
        setEngineMessage({
            ...engineMessage,
            [engineKey]: 'Connecting ...',
        })
        pipelineAPI
            .fetchTtsVoices({
                preferredVoices: [],
                ttsEngineProperties: ttsProps,
            })(pipeline.webservice)
            .then((voices: TtsVoice[]) => {
                // If any voice of the engine is now available
                if (
                    voices.filter(
                        (v) => v.engine == engineKey.split('.').slice(-1)[0]
                    ).length > 0
                ) {
                    // Connected, save the tts engine settings
                    const updatedSettings = [
                        ...ttsEngineProperties.filter(
                            (k) => !k.key.startsWith(engineKey)
                        ),
                        ...ttsProps,
                    ]
                    // Save back in the complete settings the new settings
                    onChangeTtsEngineProperties(updatedSettings)
                    setEnginePropsChanged({
                        ...enginePropsChanged,
                        [engineKey]: false,
                    })
                    // use those new settings to recompute
                    // the full voices list
                    return pipelineAPI.fetchTtsVoices({
                        preferredVoices: [],
                        ttsEngineProperties: updatedSettings,
                    })(pipeline.webservice)
                } else {
                    // could not connect
                    // indicate connection error
                    setEngineMessage({
                        ...engineMessage,
                        [engineKey]:
                            'Could not connect to engine, please check yout credentials or the service status.',
                    })
                    // and return empty array to not update the voices array
                    return []
                }
            })
            .then((fullVoicesList: TtsVoice[]) => {
                setEngineMessage({
                    ...engineMessage,
                    [engineKey]: 'Connected',
                })
                // Update the voices array if its not empty
                if (fullVoicesList.length > 0)
                    App.store.dispatch(setTtsVoices(fullVoicesList))
            })
            .catch((e) => {
                console.error(e)
                // Indicate an error
                setEngineMessage({
                    ...engineMessage,
                    [engineKey]:
                        'An error occured while trying to connect : ' + e,
                })
            })
    }

    const disconnectFromTTSEngine = (engineKey: string) => {
        setEngineMessage({
            ...engineMessage,
            [engineKey]: 'Disconnecting ...',
        })
        // Let user disconnect from a TTS engine
        // For now, remove the API key setting provided for the engine selected
        // (not ideal but not sure how to do it for now)
        const updatedSettings = [
            ...ttsEngineProperties.filter(
                (kv) =>
                    !(kv.key.startsWith(engineKey) && kv.key.endsWith('key'))
            ),
        ]
        console.log(updatedSettings)
        // Save back in the complete settings the new settings
        onChangeTtsEngineProperties(updatedSettings)
        // use those new settings to recompute
        // the full voices list
        pipelineAPI
            .fetchTtsVoices({
                preferredVoices: [],
                ttsEngineProperties: updatedSettings,
            })(pipeline.webservice)
            .then((fullVoicesList: TtsVoice[]) => {
                setEngineMessage({
                    ...engineMessage,
                    [engineKey]: 'Disconnected',
                })
                // Update the voices array if its not empty
                if (fullVoicesList.length > 0)
                    App.store.dispatch(setTtsVoices(fullVoicesList))
            })
            .catch((e) => {
                console.error(e)
                // Indicate an error
                setEngineMessage({
                    ...engineMessage,
                    [engineKey]:
                        'An error occured while trying to disconnect : ' + e,
                })
            })
    }

    return (
        <>
            <p id="available-voices-label" className="label">
                <b>Configure text-to-speech engines</b>
            </p>
            <p className="desc">
                After configuring these engines with the required credentials,
                they will be available under 'Voices'. Save and reopen the
                settings dialog to see changes.
            </p>
            <ul>
                {Object.keys(engineNames).map((engineKeyPrefix, idx) => (
                    <li key={idx}>
                        {engineNames[engineKeyPrefix]}
                        <ul>
                            {enginePropertyKeys
                                .filter((propkey) =>
                                    propkey.includes(engineKeyPrefix)
                                )
                                .map((propkey, idx) => (
                                    <li key={idx}>
                                        <label htmlFor={propkey}>
                                            {(() => {
                                                // the propkey looks like org.daisy.pipeline.tts.enginename.propkeyname
                                                // label the form field as "Propkeyname"
                                                let propkey_ = propkey.replace(
                                                    engineKeyPrefix + '.',
                                                    ''
                                                )
                                                return (
                                                    propkey_
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    propkey_.substring(1)
                                                )
                                            })()}
                                        </label>
                                        <input
                                            id={propkey}
                                            type="text"
                                            onChange={(e) =>
                                                onPropertyChange(e, propkey)
                                            }
                                            value={
                                                engineProperties.find(
                                                    (p) => p.key == propkey
                                                )?.value ?? ''
                                            }
                                        />
                                    </li>
                                ))}
                            {engineMessage[engineKeyPrefix] && (
                                <li className="error">
                                    {engineMessage[engineKeyPrefix]}
                                </li>
                            )}
                            {['azure', 'google'].includes(
                                engineKeyPrefix.split('.').slice(-1)[0]
                            ) && (
                                <li>
                                    {!isConnectedToTTSEngine(engineKeyPrefix) ||
                                    enginePropsChanged[engineKeyPrefix] ? (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                connectToTTSEngine(
                                                    engineKeyPrefix
                                                )
                                            }}
                                        >
                                            Connect
                                        </button>
                                    ) : isConnectedToTTSEngine(
                                          engineKeyPrefix
                                      ) ? (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                disconnectFromTTSEngine(
                                                    engineKeyPrefix
                                                )
                                            }}
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        ''
                                    )}
                                </li>
                            )}
                        </ul>
                    </li>
                ))}
            </ul>
        </>
    )
}
