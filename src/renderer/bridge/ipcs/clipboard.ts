import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

export function copyToClipboard(payload) {
    ipcRenderer.send(events.IPC_EVENT_copyToClipboard, payload)
}
