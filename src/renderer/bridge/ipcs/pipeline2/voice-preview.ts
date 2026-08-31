import { ipcRenderer } from 'electron'
import { IPC } from 'shared/constants'

export function fetchVoicePreview(previewUrl: string) {
    return ipcRenderer.invoke(IPC.PIPELINE.VOICE_PREVIEW, previewUrl)
}
