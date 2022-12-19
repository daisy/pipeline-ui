import { ipcRenderer } from 'electron'

import * as events from 'shared/main-renderer-events'

export function increment() {
    ipcRenderer.send(events.IPC_EVENT_increment, '')
}

export function decrement() {
    ipcRenderer.send(events.IPC_EVENT_decrement, '')
}
