/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { TtsConfig, TtsVoice, TtsEngineProperty } from 'shared/types/ttsConfig'

const enginePropertyKeys = [
    'org.daisy.pipeline.tts.azure.key',
    'org.daisy.pipeline.tts.azure.region',
    'org.daisy.pipeline.tts.google.apikey',
]
const engineNames = {
    'org.daisy.pipeline.tts.azure': 'Azure',
    'org.daisy.pipeline.tts.google': 'Google',
}

export function TtsEnginesConfigPane({
    ttsEngineProperties,
    onChangeTtsEngineProperties,
}) {
    const { pipeline } = useWindowStore()
    console.log('TTS engine props', ttsEngineProperties)
    const [engineProperties, setEngineProperties] = useState([
        ...ttsEngineProperties,
    ])

    // useEffect(() => {

    // }, [])
    let onPropertyChange = (e, propName) => {
        let engineProperties_ = [...engineProperties]
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
        setEngineProperties([...engineProperties_])
        onChangeTtsEngineProperties([...engineProperties_])
    }
    console.log(engineProperties)
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
                        </ul>
                    </li>
                ))}
            </ul>
        </>
    )
}
