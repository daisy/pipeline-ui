import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { setProperties } from 'shared/data/slices/pipeline'
import { TtsEngineState } from 'shared/types'
import { SingleFileInput } from 'renderer/components/Widgets/SingleFileInput'

const { App } = window

// Clone operation to ensure the full array is copied and avoid
// having array of references to object we don't want to change
const clone = (propsArray: Array<{ key: string; value: string }>) => [
    ...propsArray.map((kv) => ({ key: kv.key, value: kv.value })),
]
const propertyKeys = [
    'org.daisy.pipeline.tts.default-lexicon',
    'org.daisy.pipeline.tts.mp3.bitrate',
    'org.daisy.pipeline.tts.google.samplerate',
    'org.daisy.pipeline.tts.speech-rate',
]

export function TtsMoreOptionsConfigPane({
    ttsEngineProperties,
    onChangeTtsEngineProperties,
    ttsEnginesStates,
}: {
    ttsEngineProperties: Array<{ key: string; value: string }>
    onChangeTtsEngineProperties: (
        props: Array<{ key: string; value: string }>
    ) => void
    ttsEnginesStates: { [key: string]: TtsEngineState }
}) {
    const { pipeline } = useWindowStore()
    // Clone array and objects in it to avoid updating the original props
    const [engineProperties, setEngineProperties] = useState<
        Array<{ key: string; value: string }>
    >(clone(ttsEngineProperties))

    const [enginePropsChanged, setEnginePropsChanged] = useState<{
        [engineKey: string]: string
    }>({})

    const [speechRateDisplay, setSpeechRateDisplay] = useState(
        engineProperties.find(
            (prop) => prop.key == 'org.daisy.pipeline.tts.speech-rate'
        )?.value ?? '100%'
    )

    let onLexiconChange = async (filename) => {
        if (filename && filename.length > 0) {
            let fileurl = await App.pathToFileURL(filename[0])
            onPropertyChange('org.daisy.pipeline.tts.default-lexicon', fileurl)
        }
    }
    let onInputChange = (e, propName) => {
        e.preventDefault()
        let propValue = e.target.value
        if (propName == 'org.daisy.pipeline.tts.speech-rate') {
            propValue = `${propValue}%`
            setSpeechRateDisplay(propValue)
        }
        onPropertyChange(propName, propValue)
    }
    let onSelectChange = (e, propName) => {
        e.preventDefault()
        let propValue = e.target.value
        onPropertyChange(propName, propValue)
    }

    // TODO this isn't working yet
    let onPropertyChange = (propName, propValue) => {
        let engineProperties_ = clone(engineProperties)
        let prop = engineProperties_.find((prop) => prop.key == propName)
        if (prop) {
            prop.value = propValue
        } else {
            prop = {
                key: propName,
                value: propValue.trim(),
            }
            engineProperties_.push(prop)
        }
        // Search for updates compared to original props
        let realProp = (ttsEngineProperties || []).find(
            (prop) => prop.key == propName
        )
        setEnginePropsChanged({
            ...enginePropsChanged,
            [propName]:
                realProp == undefined ||
                (realProp && realProp.value != prop.value),
        })
        setEngineProperties([...engineProperties_])
        App.store.dispatch(
            setProperties([{ name: propName, value: propValue }])
        )

        onChangeTtsEngineProperties([...engineProperties_])
    }

    let resetSpeechRate = (e) => {
        onPropertyChange('org.daisy.pipeline.tts.speech-rate', '100%')
        setSpeechRateDisplay('100%')
    }

    let enginesWithSpeechRateSupport = []
    for (const engine in ttsEnginesStates) {
        if (
            ttsEnginesStates[engine].features &&
            ttsEnginesStates[engine].features?.find((f) =>
                ['speech-rate'].includes(f)
            )
        ) {
            enginesWithSpeechRateSupport.push(engine)
        }
    }

    return (
        <>
            <div>
                <label htmlFor="speechRate">
                    Speech rate: {speechRateDisplay}
                </label>
                <div className="speech-rate-controls">
                    <input
                        id="speechRate"
                        type="range"
                        max="200"
                        min="25"
                        value={
                            engineProperties.find(
                                (prop) =>
                                    prop.key ==
                                    'org.daisy.pipeline.tts.speech-rate'
                            )?.value // if the value is non-null
                                ? engineProperties
                                      .find(
                                          (prop) =>
                                              prop.key ==
                                              'org.daisy.pipeline.tts.speech-rate'
                                      )
                                      .value.slice(0, -1) // use the value minus the '%' at the end
                                : '100' // otherwise default to 100
                        }
                        onChange={(e) =>
                            onInputChange(
                                e,
                                'org.daisy.pipeline.tts.speech-rate'
                            )
                        }
                    ></input>
                    <button
                        type="button"
                        className="reset-speech-rate"
                        onClick={(e) => resetSpeechRate(e)}
                    >
                        Reset
                    </button>
                </div>
                <p className="note">
                    {enginesWithSpeechRateSupport.length > 0 ? (
                        <>
                            Setting the speech rate is currently supported on
                            {' ' +
                                (enginesWithSpeechRateSupport.length == 1
                                    ? enginesWithSpeechRateSupport[0]
                                    : enginesWithSpeechRateSupport
                                          .slice(0, -1)
                                          .join(', ') +
                                      ' and ' +
                                      enginesWithSpeechRateSupport.slice(-1)) +
                                ' '}
                            voices.
                        </>
                    ) : (
                        <>
                            Note that no speech engine supporting this setting
                            is currently found on your system.
                        </>
                    )}
                </p>
            </div>
            <div>
                <label htmlFor="bitrate">MP3 bitrate</label>
                <select
                    id="bitrate"
                    onChange={(e) =>
                        onSelectChange(e, 'org.daisy.pipeline.tts.mp3.bitrate')
                    }
                    value={
                        engineProperties.find(
                            (prop) =>
                                prop.key == 'org.daisy.pipeline.tts.mp3.bitrate'
                        )?.value ?? ''
                    }
                >
                    <option value="32">32 kbps</option>
                    <option value="96">96 kbps</option>
                    <option value="128">128 kbps</option>
                    <option value="160">160 kbps</option>
                    <option value="192">192 kbps</option>
                    <option value="256">256 kbps</option>
                    <option value="320">320 kbps</option>
                </select>
            </div>
            <div>
                <label htmlFor="samplerate">Sample rate</label>
                <select
                    id="samplerate"
                    onChange={(e) =>
                        onSelectChange(
                            e,
                            'org.daisy.pipeline.tts.google.samplerate'
                        )
                    }
                    value={
                        engineProperties.find(
                            (prop) =>
                                prop.key ==
                                'org.daisy.pipeline.tts.google.samplerate'
                        )?.value ?? '44100'
                    }
                >
                    <option value="8000">8000 Hz</option>
                    <option value="11025">11025 Hz</option>
                    <option value="16000">16000 Hz</option>
                    <option value="22050">22050 Hz</option>
                    <option value="44100">44100 Hz</option>
                    <option value="48000">48000 Hz</option>
                </select>
                <p className="note">
                    Sample rate is currently supported on Google Cloud.
                </p>
            </div>
            <div>
                <label htmlFor="lexicon-select">Choose a lexicon:</label>
                <SingleFileInput
                    allowFile={true}
                    allowFolder={false}
                    elemId="lexicon-select"
                    mediaType={['application/pls+xml']}
                    onChange={onLexiconChange}
                    initialValue={[
                        engineProperties.find(
                            (p) =>
                                p.key ==
                                'org.daisy.pipeline.tts.default-lexicon'
                        )?.value ?? '',
                    ]}
                />
            </div>
        </>
    )
}
