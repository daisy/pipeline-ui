import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'
import { useState } from 'react'
export function VoicePreview({ voice }: { voice: TtsVoice }) {
    // return <audio controls src={voice.preview}></audio>
    const [previewText, setPreviewText] = useState('')
    let updatePreview = (e) => {
        setPreviewText(e.target.value)
    }
    return (
        <div className="voice-preview">
            <h3 id="preview-label">Preview</h3>
            <input type="text" onChange={(e) => updatePreview(e)} aria-labelledby='preview-label'/>
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
