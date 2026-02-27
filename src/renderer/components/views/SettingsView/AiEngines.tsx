import { useEffect, useState } from 'react'
import { TTSEngineStatusIcon } from 'renderer/components/Widgets/SvgIcons'
import { useWindowStore } from 'renderer/store'
import { selectTtsVoices, setProperties } from 'shared/data/slices/pipeline'
import { save, setAiEngineProperties } from 'shared/data/slices/settings'
import { KeyValue } from 'shared/types'

const enginePropertyKeys = ['org.daisy.pipeline.ocr.mistral.apikey']
const engineIds = ['org.daisy.pipeline.ocr.mistral']

const { App } = window

export function AiEngines() {
    const { pipeline, settings } = useWindowStore()

    let onPropertyChange = (e, propKey) => {
        e.preventDefault()
        let aiEngineProperties_ = [...settings.aiEngineProperties]
        let idx = aiEngineProperties_.findIndex((p) => p.key == propKey)
        if (idx != -1) {
            aiEngineProperties_.splice(idx, 1)
        }
        aiEngineProperties_.push({ key: propKey, value: e.target.value.trim() })
        App.store.dispatch(setAiEngineProperties(aiEngineProperties_))
        App.store.dispatch(save())
        App.store.dispatch(
            setProperties(
                aiEngineProperties_.map((p) => ({
                    name: p.key,
                    value: p.value,
                }))
            )
        )
    }

    let getPropkeyLabel = (propkey, engineId) => {
        // the propkey looks like org.daisy.pipeline.tts.enginename.propkeyname
        // label the form field as "Propkeyname"
        let propkey_ = propkey.replace(engineId + '.', '')
        return propkey_.charAt(0).toUpperCase() + propkey_.substring(1)
    }
    let getEngineLabel = (engineId) => {
        let label = engineId.split('.').reverse()[0] ?? engineId
        return label.charAt(0).toUpperCase() + label.substring(1)
    }

    return (
        <div className="ai-engines">
            <ul>
                {engineIds.map((engineId, idx) => (
                    <li key={engineId + '-' + idx}>
                        <h2>{getEngineLabel(engineId)}</h2>
                        {enginePropertyKeys
                            .filter((propkey) => propkey.includes(engineId))
                            .map((propkey, idx) => (
                                <div>
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
                                            settings.aiEngineProperties.find(
                                                (p) => p.key == propkey
                                            )?.value ?? ''
                                        }
                                    />
                                    </div>
                                    <p className="description">
                                        {pipeline.properties
                                            ? pipeline.properties[propkey]?.desc
                                            : ''}
                                    </p>
                                </div>
                            ))}
                    </li>
                ))}
            </ul>
        </div>
    )
}
