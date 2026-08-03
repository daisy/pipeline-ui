import { useWindowStore } from 'renderer/store'
import { setProperties } from 'shared/data/slices/pipeline'
import { save, setAiEngineProperties } from 'shared/data/slices/settings'

const ocrEngines = BUILD_ENABLE_OCR
    ? [
          {
              engineId: 'org.daisy.pipeline.ocr.mistral',
              propertyKeys: ['org.daisy.pipeline.ocr.mistral.apikey'],
          },
          {
              engineId: 'org.daisy.pipeline.ocr.datalab',
              propertyKeys: ['org.daisy.pipeline.ocr.datalab.apikey'],
          },
      ]
    : []

const { App } = window

export function AiEngines() {
    const { pipeline, settings } = useWindowStore()

    let onPropertyChange = (e, propKey) => {
        e.preventDefault()
        let aiEngineProperties_ = [...(settings.aiEngineProperties ?? [])]
        let idx = aiEngineProperties_.findIndex((p) => p.key == propKey)
        if (idx != -1) {
            aiEngineProperties_.splice(idx, 1)
        }
        aiEngineProperties_.push({
            key: propKey,
            value: e.target.value.trim(),
        })
        App.store.dispatch(setAiEngineProperties(aiEngineProperties_))
        App.store.dispatch(save())
        App.store.dispatch(
            setProperties({
                values: aiEngineProperties_.map((p) => ({
                    name: p.key,
                    value: p.value,
                })),
                sendToAPI: true,
            })
        )
    }

    let getPropkeyLabel = (propkey, engineId) => {
        // the propkey looks like org.daisy.pipeline.category.enginename.propkeyname
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
                {ocrEngines.map((engine, idx) => (
                    <li key={engine.engineId + '-' + idx}>
                        <h2>{getEngineLabel(engine.engineId)}</h2>
                        {engine.propertyKeys.map((propkey) => (
                            <div key={propkey}>
                                <div className="field">
                                    <label htmlFor={propkey}>
                                        {getPropkeyLabel(
                                            propkey,
                                            engine.engineId
                                        )}
                                    </label>
                                    <input
                                        id={propkey}
                                        type="text"
                                        onChange={(e) =>
                                            onPropertyChange(e, propkey)
                                        }
                                        value={
                                            settings.aiEngineProperties?.find(
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
