import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'
import type { ExternalFileOpenData } from 'shared/main-renderer-events'

// Capture any message that arrives before the React listener registers
let buffered: ExternalFileOpenData | null = null
ipcRenderer.on(events.IPC_EVENT_openExternalFile, (_, data) => {
    buffered = data
})

export function onExternalFileOpen(
    listener: (data: ExternalFileOpenData) => void
) {
    if (buffered) {
        listener(buffered)
        buffered = null
    }
    ipcRenderer.on(events.IPC_EVENT_openExternalFile, (_, data) => {
        listener(data)
    })
}
