// @ts-ignore
import { AiEngines } from './AiEngines'
// @ts-ignore
import { TTSEngines } from './TTSEngines'

export function ExternalServices({
    newSettings,
    onChangeTtsEngineProperties,
    onChangeTtsEngineConnected,
}) {
    return (
        <>
            <h2>Text-to-speech</h2>
            <TTSEngines
                ttsEngineProperties={newSettings.ttsConfig.ttsEngineProperties}
                ttsEnginesConnected={newSettings.ttsConfig.ttsEnginesConnected}
                onChangeTtsEngineProperties={onChangeTtsEngineProperties}
                onChangeTtsEngineConnected={onChangeTtsEngineConnected}
            />
            <h2>OCR</h2>
            <AiEngines />
        </>
    )
}
