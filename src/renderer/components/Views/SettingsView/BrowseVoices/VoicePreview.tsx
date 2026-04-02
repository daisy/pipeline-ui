import { TtsVoice } from 'shared/types/ttsConfig'
import { useState } from 'react'
export function VoicePreview({
    voice,
    availableVoices,
}: {
    voice: TtsVoice
    availableVoices: TtsVoice[]
}) {
    const [previewText, setPreviewText] = useState('')
    let updatePreview = (e) => {
        setPreviewText(e.target.value)
    }
    const previewUrl = availableVoices.find(
        (v) => v.engine === voice.engine && v.name === voice.name
    )?.preview
    return (
        <div className="voice-preview">
            <p id="preview-label">Enter text to hear a preview:</p>
            <input
                type="text"
                onChange={(e) => updatePreview(e)}
                aria-labelledby="preview-label"
                placeholder="Hello, my name is..."
            />
            <audio
                controls
                src={
                    previewUrl
                        ? previewText.length
                            ? `${previewUrl}?text=${encodeURIComponent(
                                  previewText
                              ).replaceAll('%20', '+')}`
                            : previewUrl
                        : undefined
                }
            />
        </div>
    )
}
