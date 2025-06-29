import { TtsVoice } from 'shared/types/ttsConfig'
import { useState } from 'react'
export function VoicePreview({ voice }: { voice: TtsVoice }) {
    // return <audio controls src={voice.preview}></audio>
    const [previewText, setPreviewText] = useState('')
    let updatePreview = (e) => {
        setPreviewText(e.target.value)
    }
    return (
        <div className="voice-preview">
            <p id="preview-label">Enter text to hear a preview:</p>
            <input type="text" onChange={(e) => updatePreview(e)} aria-labelledby='preview-label' placeholder='Hello, my name is...'/>
            <audio
                controls
                src={
                    previewText.length
                        ? `${voice.preview}?text=${encodeURIComponent(
                              previewText
                          ).replaceAll('%20', '+')}`
                        : voice.preview
                }
            />
        </div>
    )
}
