import { useEffect, useState } from 'react'
import { TTSEngineStatusIcon } from 'renderer/components/Widgets/SvgIcons'
import { useWindowStore } from 'renderer/store'
import { selectTtsVoices, setProperties } from 'shared/data/slices/pipeline'
import { TtsEngineConnected, TtsEngineProperty } from 'shared/types/ttsConfig'

const enginePropertyKeys = [
    'org.daisy.pipeline.tts.azure.key',
    'org.daisy.pipeline.tts.azure.region',
    'org.daisy.pipeline.tts.google.apikey',
    'org.daisy.pipeline.tts.aws.accesskey',
    'org.daisy.pipeline.tts.aws.secretkey',
    'org.daisy.pipeline.tts.aws.region',
]
const engineIds = [
    'org.daisy.pipeline.tts.azure',
    'org.daisy.pipeline.tts.google',
    'org.daisy.pipeline.tts.aws',
]

const { App } = window

// Clone operation to ensure the full array is copied and avoid
// having array of references to object we don't want to change
const clone = (propsArray: Array<{ key: string; value: string }>) => [
    ...propsArray.map((kv) => ({ key: kv.key, value: kv.value })),
]

export function Engines({
    ttsEngineProperties,
    ttsEnginesConnected,
    onChangeTtsEngineProperties,
    onChangeTtsEngineConnected,
}: {
    ttsEngineProperties: Array<TtsEngineProperty>
    ttsEnginesConnected: Array<TtsEngineConnected>
    onChangeTtsEngineProperties: (props: Array<TtsEngineProperty>) => void
    onChangeTtsEngineConnected: (engineConnected: TtsEngineConnected, props: Array<TtsEngineProperty>) => void
}) {
    // console.log('Engine.tsx TTS Engine Properties', ttsEngineProperties)
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
        // console.log('onPropertyChange', e, propName)
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
        let shortEngineKey = engineKey.split('.').slice(-1)[0]
        let isConnected =
            selectTtsVoices(App.store.getState()).filter(
                (v) => v.engine == shortEngineKey
            ).length > 0
        // console.log('isConnectedToTTSEngine', engineKey, isConnected)
        return isConnected
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
        // clear the changed flag
        let enginePropsChanged_ = { ...enginePropsChanged }
        enginePropsChanged_[engineKey] = false
        setEnginePropsChanged(enginePropsChanged_)

        // onChangeTtsEngineProperties(updatedSettings)
        onChangeTtsEngineConnected(
            { key: engineKey, connected: true },
            updatedSettings
        )
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

        // onChangeTtsEngineProperties(ttsProps)
        onChangeTtsEngineConnected(
            { key: engineKey, connected: false },
            ttsProps
        )
    }
    let getPropkeyLabel = (propkey, engineId) => {
        // the propkey looks like org.daisy.pipeline.tts.enginename.propkeyname
        // label the form field as "Propkeyname"
        let propkey_ = propkey.replace(engineId + '.', '')
        return propkey_.charAt(0).toUpperCase() + propkey_.substring(1)
    }
    let getEngineLabel = (engineId) => {
        return (
            pipeline.ttsEnginesStates[engineId.split('.').reverse()[0]]?.name ??
            engineId
        )
    }
    let hasRequiredValues = (engineId) => {
        let propsForEngine = engineProperties.filter(
            (prop) => prop.key.indexOf(engineId) != -1
        )
        let incompleteEngineValues = propsForEngine.filter(
            (prop) => prop.value.trim() == ''
        )

        return propsForEngine.length > 0 && incompleteEngineValues.length == 0
    }
    let hasChangedProps = (engineId) => {
        // console.log('hasChangedProps', engineId, enginePropsChanged)
        return enginePropsChanged[engineId]
    }

    return (
        <div className="tts-engines">
            <p>
                After configuring these engines with the required credentials,
                they will be available under 'Voices'.
            </p>
            <ul>
                {engineIds.map((engineId, idx) => (
                    <li key={engineId + '-' + idx}>
                        <h2>{getEngineLabel(engineId)}</h2>
                        {enginePropertyKeys
                            .filter((propkey) => propkey.includes(engineId))
                            .map((propkey, idx) => (
                                <div className="field" key={idx}>
                                    <label htmlFor={propkey}>
                                        {getPropkeyLabel(propkey, engineId)}
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
                                </div>
                            ))}
                        {engineMessage[engineId] && (
                            <div
                                className={`engine-status ${engineStatus[engineId]}`}
                            >
                                {engineMessage[engineId].split('\n').length ===
                                1 ? (
                                    <span>{engineMessage[engineId]}</span>
                                ) : (
                                    <details>
                                        <summary>
                                            {
                                                engineMessage[engineId].split(
                                                    '\n'
                                                )[0]
                                            }
                                        </summary>
                                        {engineMessage[engineId]
                                            .split('\n')
                                            .slice(1)
                                            .join('\n')}
                                    </details>
                                )}
                                {TTSEngineStatusIcon(engineStatus[engineId], {
                                    width: 20,
                                    height: 20,
                                })}
                            </div>
                        )}
                        {['azure', 'google', 'aws'].includes(
                            engineId.split('.').slice(-1)[0]
                        ) && (
                            <>
                                {!isConnectedToTTSEngine(engineId) ||
                                hasChangedProps(engineId) ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                connectToTTSEngine(engineId)
                                            }}
                                            disabled={
                                                !hasRequiredValues(engineId)
                                            }
                                        >
                                            Connect
                                        </button>
                                        {!hasRequiredValues(engineId) && (
                                            <p className="warning info">
                                                Please fill out all values for
                                                this engine
                                            </p>
                                        )}
                                    </>
                                ) : isConnectedToTTSEngine(engineId) ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            disconnectFromTTSEngine(engineId)
                                        }}
                                    >
                                        Disconnect
                                    </button>
                                ) : (
                                    ''
                                )}
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
