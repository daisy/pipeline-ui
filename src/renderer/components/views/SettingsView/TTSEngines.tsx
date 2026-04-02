import { useEffect, useRef, useState } from 'react'
import { TTSEngineStatusIcon } from 'renderer/components/Widgets/SvgIcons'
import { useWindowStore } from 'renderer/store'
import { setProperties } from 'shared/data/slices/pipeline'
import { KeyValue, PipelineStatus } from 'shared/types'

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

export function TTSEngines({
    ttsEngineProperties,
    ttsEnginesConnected,
    onChangeTtsEngineProperties,
    onChangeTtsEngineConnected,
}: {
    ttsEngineProperties: Array<KeyValue>
    ttsEnginesConnected: Object
    onChangeTtsEngineProperties: (props: Array<KeyValue>) => void
    onChangeTtsEngineConnected: (
        engineId: string,
        isConnected: boolean,
        props: Array<KeyValue>
    ) => void
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

    const [attemptedConnection, setAttemptedConnection] = useState({})

    const [isConnecting, setIsConnecting] = useState<{
        [engineKey: string]: 'connecting' | 'disconnecting' | false
    }>({})
    const connectingTimers = useRef<{
        [engineKey: string]: ReturnType<typeof setTimeout>
    }>({})

    // Clear isConnecting when status settles.
    // Connecting: clear immediately on 'available', after 45s on terminal error states.
    // Disconnecting: clear immediately on 'disabled'/'disconnected', after 45s as fallback.
    useEffect(() => {
        for (const engineId of engineIds) {
            if (!isConnecting[engineId]) continue
            const status = engineStatus[engineId]
            if (isConnecting[engineId] === 'connecting') {
                if (status === 'available') {
                    clearTimeout(connectingTimers.current[engineId])
                    delete connectingTimers.current[engineId]
                    setIsConnecting((prev) => ({ ...prev, [engineId]: false }))
                } else if (
                    ['disabled', 'disconnected'].includes(status) &&
                    !connectingTimers.current[engineId]
                ) {
                    connectingTimers.current[engineId] = setTimeout(() => {
                        delete connectingTimers.current[engineId]
                        setIsConnecting((prev) => ({
                            ...prev,
                            [engineId]: false,
                        }))
                    }, 45000)
                } else if (status === 'connecting') {
                    clearTimeout(connectingTimers.current[engineId])
                    delete connectingTimers.current[engineId]
                }
            } else if (isConnecting[engineId] === 'disconnecting') {
                if (['disabled', 'disconnected'].includes(status)) {
                    clearTimeout(connectingTimers.current[engineId])
                    delete connectingTimers.current[engineId]
                    setIsConnecting((prev) => ({ ...prev, [engineId]: false }))
                } else if (!connectingTimers.current[engineId]) {
                    connectingTimers.current[engineId] = setTimeout(() => {
                        delete connectingTimers.current[engineId]
                        setIsConnecting((prev) => ({
                            ...prev,
                            [engineId]: false,
                        }))
                    }, 45000)
                }
            }
        }
    }, [engineStatus, isConnecting])

    useEffect(() => {
        let messages = { ...engineMessage }
        let statuses = { ...engineStatus }
        for (let engineKey in pipeline.ttsEnginesStates) {
            // Note : engineKey in template is the full one
            // while in voices only the final name is given
            messages['org.daisy.pipeline.tts.' + engineKey] =
                pipeline.ttsEnginesStates[engineKey].message
                    ?.split('\n')
                    .filter((line) => !line.includes('.enabled'))
                    .join('\n') || null
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
        const newValue = e.target.value.trim()
        if (prop) {
            prop.value = newValue
        } else {
            engineProperties_.push({ key: propName, value: newValue })
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

        // If the field was cleared, send the empty value to the engine
        // immediately and mark the engine as disconnected
        if (newValue === '') {
            App.store.dispatch(
                setProperties({
                    values: [
                        { name: propName, value: '' },
                        { name: engineKey + '.enabled', value: 'false' },
                    ],
                    sendToAPI: true,
                })
            )
            onChangeTtsEngineConnected(engineKey, false, engineProperties_)
        }
    }

    const connected = ttsEnginesConnected as Record<string, boolean>

    const connectToTTSEngine = (engineKey: string) => {
        const ttsProps = [
            ...engineProperties.filter(
                (k) =>
                    k.key.startsWith(engineKey) && !k.key.endsWith('.enabled')
            ),
        ]
        // send the properties to the engine for voices reloading
        // add the enabled property to the list - it's not used by the UI but it helps the engine do the right thing
        ttsProps.push({ key: engineKey + '.enabled', value: 'true' })
        App.store.dispatch(
            setProperties({
                values: ttsProps.map((p) => ({ name: p.key, value: p.value })),
                sendToAPI: true,
            })
        )
        const updatedSettings = [
            ...ttsEngineProperties.filter((k) => !k.key.startsWith(engineKey)),
            ...ttsProps,
        ]
        // clear the changed flag
        let enginePropsChanged_ = { ...enginePropsChanged }
        enginePropsChanged_[engineKey] = false
        setEnginePropsChanged(enginePropsChanged_)

        setIsConnecting((prev) => ({ ...prev, [engineKey]: 'connecting' }))

        let attemptedConnection_ = { ...attemptedConnection }
        attemptedConnection_[engineKey] = true
        setAttemptedConnection({ ...attemptedConnection_ })
        onChangeTtsEngineConnected(engineKey, true, updatedSettings)
    }

    const disconnectFromTTSEngine = (engineKey: string) => {
        // Send empty credential values + enabled=false to the engine
        // but keep the credential values in settings so the user can reconnect
        App.store.dispatch(
            setProperties({
                values: [
                    ...engineProperties
                        .filter((k) => k.key.startsWith(engineKey))
                        .map((p) => ({ name: p.key, value: '' })),
                    { name: engineKey + '.enabled', value: 'false' },
                ],
                sendToAPI: true,
            })
        )

        setIsConnecting((prev) => ({ ...prev, [engineKey]: 'disconnecting' }))

        let attemptedConnection_ = { ...attemptedConnection }
        attemptedConnection_[engineKey] = false
        setAttemptedConnection({ ...attemptedConnection_ })

        const enabledKey = engineKey + '.enabled'
        const propsForSave = engineProperties.some((p) => p.key === enabledKey)
            ? engineProperties.map((p) =>
                  p.key === enabledKey ? { ...p, value: 'false' } : p
              )
            : [...engineProperties, { key: enabledKey, value: 'false' }]
        onChangeTtsEngineConnected(engineKey, false, propsForSave)
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
        return enginePropsChanged[engineId]
    }

    const engineNotReady = pipeline.status !== PipelineStatus.RUNNING
    const isStartingUp = engineNotReady || pipeline.ttsVoices === null

    return (
        <div className={`tts-engines${isStartingUp ? ' starting-up' : ''}`}>
            <p>
                After configuring these engines with the required credentials,
                they will be available under 'Voices'.
            </p>
            {engineNotReady && (
                <p className="startup-status">Starting Pipeline engine...</p>
            )}
            {!engineNotReady && pipeline.ttsVoices === null && (
                <p className="startup-status">Initializing connections...</p>
            )}
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
                                        disabled={engineNotReady}
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
                        {isConnecting[engineId] === 'connecting' && (
                            <div className="engine-status connecting">
                                <span>Connecting...</span>
                            </div>
                        )}
                        {isConnecting[engineId] === 'disconnecting' && (
                            <div className="engine-status disconnecting">
                                <span>Disconnecting...</span>
                            </div>
                        )}
                        {!isConnecting[engineId] &&
                            !connected[engineId] &&
                            attemptedConnection[engineId] !== true && (
                                <div className="engine-status disconnected">
                                    <span>Disconnected</span>
                                </div>
                            )}
                        {!isConnecting[engineId] &&
                            engineMessage[engineId] &&
                            !hasChangedProps(engineId) &&
                            (connected[engineId] ||
                                attemptedConnection[engineId] === true) &&
                            ['available', 'disabled', 'disconnected'].includes(
                                engineStatus[engineId]
                            ) && (
                                <div
                                    className={`engine-status ${engineStatus[engineId]}`}
                                >
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
                                    {TTSEngineStatusIcon(
                                        engineStatus[engineId],
                                        {
                                            width: 20,
                                            height: 20,
                                        }
                                    )}
                                </div>
                            )}
                        {['azure', 'google', 'aws'].includes(
                            engineId.split('.').slice(-1)[0]
                        ) && (
                            <>
                                {!connected[engineId] ||
                                hasChangedProps(engineId) ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                connectToTTSEngine(engineId)
                                            }}
                                            disabled={
                                                engineNotReady ||
                                                !hasRequiredValues(engineId) ||
                                                !!isConnecting[engineId] ||
                                                (!hasChangedProps(engineId) &&
                                                    ![
                                                        'disconnected',
                                                        'disabled',
                                                    ].includes(
                                                        engineStatus[engineId]
                                                    ))
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
                                ) : connected[engineId] ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            disconnectFromTTSEngine(engineId)
                                        }}
                                        disabled={
                                            engineNotReady ||
                                            !!isConnecting[engineId] ||
                                            engineStatus[engineId] !=
                                                'available'
                                        }
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
