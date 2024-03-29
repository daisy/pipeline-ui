import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { PipelineAPI } from 'shared/data/apis/pipeline'
import { setProperties } from 'shared/data/slices/pipeline'
import { FileOrFolderInput } from '../Fields/FileOrFolderInput'

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
const propertyKeys = [
    'org.daisy.pipeline.tts.default-lexicon',
    'org.daisy.pipeline.tts.mp3.bitrate',
    'org.daisy.pipeline.tts.google.samplerate',
    'org.daisy.pipeline.tts.speech-rate',
]

export function TtsMoreOptionsConfigPane({
    ttsEngineProperties,
    onChangeTtsEngineProperties,
}) {
    const { pipeline } = useWindowStore()
    console.log('TTS engine props, more options screen ', ttsEngineProperties)
    // Clone array and objects in it to avoid updating the original props
    const [engineProperties, setEngineProperties] = useState<
        Array<{ key: string; value: string }>
    >(clone(ttsEngineProperties))

    const [enginePropsChanged, setEnginePropsChanged] = useState<{
        [engineKey: string]: boolean
    }>({})

    let onLexiconChange = (filename) => {
        onPropertyChange('org.daisy.pipeline.tts.default-lexicon', filename)
    }
    let onInputChange = (e, propName) => {
        e.preventDefault()
        let propValue = e.target.value
        onPropertyChange(propName, propValue)
    }
    let onSelectChange = (e, propName) => {
        e.preventDefault()
        let propValue = e.target.value
        onPropertyChange(propName, propValue)
    }

    // TODO this isn't working yet
    let onPropertyChange = (propName, propValue) => {
        console.log('name', propName)
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
        console.log('old prop', realProp)
        console.log('new prop', prop)
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

    return (
        <>
            <div>
                <label htmlFor="speechRate">Speech rate</label>
                <input
                    id="speechRate"
                    type="range"
                    max="200"
                    min="25"
                    value={
                        engineProperties.find(
                            (prop) =>
                                prop.key == 'org.daisy.pipeline.tts.speech-rate'
                        )?.value ?? '100'
                    }
                    onChange={(e) =>
                        onInputChange(e, 'org.daisy.pipeline.tts.speech-rate')
                    }
                ></input>
                <p className="note">
                    Setting the speech rate is currently supported on XYZ
                    voices/engines.
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
                        )?.value ?? ''
                    }
                >
                    <option value="8000">8000 Hz</option>
                    <option value="11025">11025 Hz</option>
                    <option value="16000">16000 Hz</option>
                    <option value="22050">22050 Hz</option>
                    <option value="44100" selected>
                        44100 Hz
                    </option>
                    <option value="48000">48000 Hz</option>
                </select>
                <p className="note">
                    Sample rate is currently supported on Google Cloud.
                </p>
            </div>
            <div>
                <label htmlFor="lexicon-select">Choose a lexicon:</label>
                <FileOrFolderInput
                    type="open"
                    dialogProperties={['openFile']}
                    elemId="lexicon-select"
                    mediaType={['application/pls+xml']}
                    name="Lexicon"
                    onChange={(filename) => onLexiconChange(filename)}
                    useSystemPath={false}
                    buttonLabel="Browse"
                    required={false}
                    initialValue={
                        engineProperties.find(
                            (p) =>
                                p.key ==
                                'org.daisy.pipeline.tts.default-lexicon'
                        )?.value ?? ''
                    }
                />
            </div>
        </>
    )
}
