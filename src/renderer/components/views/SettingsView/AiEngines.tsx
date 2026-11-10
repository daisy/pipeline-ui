/*
OCR services settings (issue #386).

The API key is only sent to the engine when the user presses Connect (or
Enter in the field). The engine then checks the key with the service and
reports the result on /ocr/services, which is shown under each service.
Disconnect sets the service's `.enabled` property to false and keeps the key
so the user can reconnect without typing it again.
*/
import { useState } from 'react'
import { TTSEngineStatusIcon } from 'renderer/components/Widgets/SvgIcons'
import { useWindowStore } from 'renderer/store'
import { setOcrServicesState, setProperties } from 'shared/data/slices/pipeline'
import { save, setAiEngineProperties } from 'shared/data/slices/settings'
import { KeyValue, PipelineStatus } from 'shared/types'

type OcrService = {
    key: string // name used by /ocr/services
    engineId: string // property prefix
    propertyKeys: string[]
    label: string // used until the engine reports its own name
}

const ocrServices: OcrService[] = BUILD_ENABLE_OCR
    ? [
          {
              key: 'mistral',
              engineId: 'org.daisy.pipeline.ocr.mistral',
              propertyKeys: ['org.daisy.pipeline.ocr.mistral.apikey'],
              label: 'Mistral',
          },
          {
              key: 'datalab',
              engineId: 'org.daisy.pipeline.ocr.datalab',
              propertyKeys: ['org.daisy.pipeline.ocr.datalab.apikey'],
              label: 'Datalab',
          },
      ]
    : []

const { App } = window

const savedValue = (props: KeyValue[] | undefined, key: string) =>
    props?.find((p) => p.key == key)?.value ?? ''

// the propkey looks like org.daisy.pipeline.ocr.enginename.propkeyname
// label the form field as "Propkeyname"
const getPropkeyLabel = (propkey: string, engineId: string) => {
    const name = propkey.replace(engineId + '.', '')
    return name == 'apikey'
        ? 'API key'
        : name.charAt(0).toUpperCase() + name.substring(1)
}

export function AiEngines({ disabled = false }: { disabled?: boolean }) {
    const { pipeline, settings } = useWindowStore()
    const savedProps = settings.aiEngineProperties ?? []

    // values being edited, saved only on Connect
    const [values, setValues] = useState<{ [propkey: string]: string }>(() =>
        Object.fromEntries(
            ocrServices.flatMap((s) =>
                s.propertyKeys.map((k) => [k, savedValue(savedProps, k)])
            )
        )
    )

    const engineNotReady = pipeline.status !== PipelineStatus.RUNNING
    const controlsDisabled = disabled || engineNotReady

    const hasChanges = (service: OcrService) =>
        service.propertyKeys.some(
            (k) => (values[k] ?? '') != savedValue(savedProps, k)
        )
    const hasRequiredValues = (service: OcrService) =>
        service.propertyKeys.every((k) => (values[k] ?? '').trim() != '')

    const saveServiceProps = (service: OcrService, props: KeyValue[]) => {
        const others = savedProps.filter(
            (p) => !p.key.startsWith(service.engineId + '.')
        )
        App.store.dispatch(setAiEngineProperties([...others, ...props]))
        App.store.dispatch(save())
    }

    const connect = (service: OcrService) => {
        if (controlsDisabled || !hasRequiredValues(service)) return
        const props: KeyValue[] = [
            ...service.propertyKeys.map((k) => ({
                key: k,
                value: (values[k] ?? '').trim(),
            })),
            { key: service.engineId + '.enabled', value: 'true' },
        ]
        saveServiceProps(service, props)
        App.store.dispatch(
            setOcrServicesState({
                [service.key]: {
                    status: 'connecting',
                    message: 'Connecting...',
                },
            })
        )
        App.store.dispatch(
            setProperties({
                values: props.map((p) => ({ name: p.key, value: p.value })),
                sendToAPI: true,
            })
        )
    }

    const disconnect = (service: OcrService) => {
        if (controlsDisabled) return
        // keep the key, only switch the service off
        const enabledProp = {
            key: service.engineId + '.enabled',
            value: 'false',
        }
        saveServiceProps(service, [
            ...savedProps.filter(
                (p) =>
                    p.key.startsWith(service.engineId + '.') &&
                    p.key != enabledProp.key
            ),
            enabledProp,
        ])
        App.store.dispatch(
            setOcrServicesState({
                [service.key]: {
                    status: 'disconnecting',
                    message: 'Disconnecting...',
                },
            })
        )
        App.store.dispatch(
            setProperties({
                values: [{ name: enabledProp.key, value: enabledProp.value }],
                sendToAPI: true,
            })
        )
    }

    const renderStatus = (service: OcrService) => {
        const state = pipeline.ocrServicesStates?.[service.key]
        if (!state?.status) return null
        if (['connecting', 'disconnecting'].includes(state.status)) {
            return <span>{state.message}</span>
        }
        // the status is about the saved key, not the one being typed
        if (hasChanges(service)) return null
        const [summary, ...details] = (state.message ?? '').split('\n')
        const detailText = details.join('\n').trim()
        return (
            <>
                {detailText ? (
                    <details>
                        <summary>{summary}</summary>
                        {detailText}
                    </details>
                ) : (
                    <span>{summary}</span>
                )}
                {TTSEngineStatusIcon(state.status, { width: 20, height: 20 })}
            </>
        )
    }

    return (
        <div className={`ai-engines${engineNotReady ? ' starting-up' : ''}`}>
            {engineNotReady && (
                <p className="startup-status">Starting Pipeline engine...</p>
            )}
            <ul>
                {ocrServices.map((service) => {
                    const state = pipeline.ocrServicesStates?.[service.key]
                    const busy = ['connecting', 'disconnecting'].includes(
                        state?.status
                    )
                    const showDisconnect =
                        state?.status == 'available' && !hasChanges(service)
                    const statusId = `${service.engineId}-status`
                    return (
                        <li key={service.engineId}>
                            <h2>{state?.name ?? service.label}</h2>
                            {service.propertyKeys.map((propkey) => (
                                <div key={propkey}>
                                    <div className="field">
                                        <label htmlFor={propkey}>
                                            {getPropkeyLabel(
                                                propkey,
                                                service.engineId
                                            )}
                                        </label>
                                        <input
                                            id={propkey}
                                            type="text"
                                            disabled={controlsDisabled}
                                            aria-describedby={statusId}
                                            onChange={(e) =>
                                                setValues({
                                                    ...values,
                                                    [propkey]: e.target.value,
                                                })
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key == 'Enter') {
                                                    e.preventDefault()
                                                    connect(service)
                                                }
                                            }}
                                            value={values[propkey] ?? ''}
                                        />
                                    </div>
                                    <p className="description">
                                        {pipeline.properties
                                            ? pipeline.properties[propkey]?.desc
                                            : ''}
                                    </p>
                                </div>
                            ))}
                            {/* always rendered so status changes are announced */}
                            <div
                                id={statusId}
                                className={`engine-status ${state?.status ?? ''}`}
                                role="status"
                                aria-live="polite"
                            >
                                {renderStatus(service)}
                            </div>
                            {showDisconnect ? (
                                <button
                                    type="button"
                                    onClick={() => disconnect(service)}
                                    disabled={controlsDisabled || busy}
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => connect(service)}
                                        disabled={
                                            controlsDisabled ||
                                            busy ||
                                            !hasRequiredValues(service)
                                        }
                                    >
                                        Connect
                                    </button>
                                    {!hasRequiredValues(service) && (
                                        <p className="warning info">
                                            Enter an API key to connect
                                        </p>
                                    )}
                                </>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
