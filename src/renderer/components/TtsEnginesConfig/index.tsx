import { useEffect, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { PipelineAPI } from 'shared/data/apis/pipeline'
import {
    selectTtsVoices,
    setProperties,
    setTtsEngineState,
    setTtsVoices,
} from 'shared/data/slices/pipeline'
import {
    TtsEngineProperty,
    TtsEngineState,
    TtsVoice,
} from 'shared/types/ttsConfig'

const enginePropertyKeys = [
    'org.daisy.pipeline.tts.azure.key',
    'org.daisy.pipeline.tts.azure.region',
    'org.daisy.pipeline.tts.google.apikey',
]
const engineIds = [
    'org.daisy.pipeline.tts.azure',
    'org.daisy.pipeline.tts.google',
]

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
}: {
    ttsEngineProperties: Array<TtsEngineProperty>
    onChangeTtsEngineProperties: (props: Array<TtsEngineProperty>) => void
}) {
    const { pipeline } = useWindowStore()
    // Clone array and objects in it to avoid updating the oriiginal props
    const [engineProperties, setEngineProperties] = useState<
        Array<{ key: string; value: string }>
    >(clone(ttsEngineProperties))

    const [engineMessage, setEngineMessage] = useState<{
        [engineKey: string]: string
    }>({})

    const [engineStatus, setEngineStatus] = useState<{
        [engineKey: string]: string
    }>({})

    const [enginePropsChanged, setEnginePropsChanged] = useState<{
        [engineKey: string]: boolean
    }>({})

    useEffect(() => {
        let messages = { ...engineMessage }
        let statuses = { ...engineStatus }
        for (let engineKey in pipeline.ttsEnginesStates) {
            // Note : engineKey in template is the full one
            // while in voices only the final name is given
            messages['org.daisy.pipeline.tts.' + engineKey] =
                pipeline.ttsEnginesStates[engineKey].message
            statuses['org.daisy.pipeline.tts.' + engineKey] =
                pipeline.ttsEnginesStates[engineKey].status
        }
        setEngineMessage(messages)
        setEngineStatus(statuses)
    }, [pipeline.ttsEnginesStates])

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
        // send the properties to the engine for voices reloading
        App.store.dispatch(
            setProperties(
                ttsProps.map((p) => ({ name: p.key, value: p.value }))
            )
        )
        const updatedSettings = [
            ...ttsEngineProperties.filter((k) => !k.key.startsWith(engineKey)),
            ...ttsProps,
        ]
        onChangeTtsEngineProperties(updatedSettings)
    }

    const disconnectFromTTSEngine = (engineKey: string) => {
        const ttsProps = [
            ...engineProperties.filter((k) => k.key.startsWith(engineKey)),
        ]
        // remove properties value on the engine side to disconnect
        // but keep the settings in the app
        App.store.dispatch(
            setProperties(ttsProps.map((p) => ({ name: p.key, value: '' })))
        )
        // TODO : add a setting to let users disable autoconnect on startup
        onChangeTtsEngineProperties(ttsProps)
    }
    console.log(engineProperties)
    return (
        <>
            <p className="desc">
                After configuring these engines with the required credentials,
                they will be available under 'Voices'.
            </p>
            <ul>
                {engineIds.map((engineId, idx) => (
                    <li key={engineId + '-' + idx}>
                        {pipeline.ttsEnginesStates[
                            engineId.split('.').reverse()[0]
                        ]?.name ?? engineId}

                        <ul>
                            {enginePropertyKeys
                                .filter((propkey) => propkey.includes(engineId))
                                .map((propkey, idx) => (
                                    <li key={propkey + '-' + idx}>
                                        <label htmlFor={propkey}>
                                            {(() => {
                                                // the propkey looks like org.daisy.pipeline.tts.enginename.propkeyname
                                                // label the form field as "Propkeyname"
                                                let propkey_ = propkey.replace(
                                                    engineId + '.',
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
                                        <div className="input">
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
                                                required
                                            />
                                            {!(engineProperties.find(
                                                (p) => p.key == propkey
                                            )?.value) && (
                                                <span className="required-field-message">
                                                    This field is required
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            {engineMessage[engineId] && (
                                <li className={engineStatus[engineId]}>
                                    {engineMessage[engineId].split('\n')
                                        .length === 1 ? (
                                        <span>{engineMessage[engineId]}</span>
                                    ) : (
                                        <details>
                                            <summary>
                                                {
                                                    engineMessage[
                                                        engineId
                                                    ].split('\n')[0]
                                                }
                                            </summary>
                                            {engineMessage[engineId]
                                                .split('\n')
                                                .slice(1)
                                                .join('\n')}
                                        </details>
                                    )}
                                </li>
                            )}
                            {['azure', 'google'].includes(
                                engineId.split('.').slice(-1)[0]
                            ) && (
                                <li>
                                    {!isConnectedToTTSEngine(engineId) ||
                                    enginePropsChanged[engineId] ? (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                connectToTTSEngine(engineId)
                                            }}
                                        >
                                            Connect
                                        </button>
                                    ) : isConnectedToTTSEngine(engineId) ? (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                disconnectFromTTSEngine(
                                                    engineId
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
