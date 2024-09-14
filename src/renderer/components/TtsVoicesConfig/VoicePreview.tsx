import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'

export function VoicePreview({ voice }: { voice: TtsVoice }) {
    return <audio controls src={voice.preview}></audio>
}
