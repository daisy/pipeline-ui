import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

export function log(payload) {
    ipcRenderer.send(events.IPC_EVENT_log, payload)
}
