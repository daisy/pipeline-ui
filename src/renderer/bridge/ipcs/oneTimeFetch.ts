import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// get data from an arbitrary endpoint using main process fetch
export function oneTimeFetch(url) {
    return ipcRenderer.invoke(events.IPC_EVENT_oneTimeFetch, url)
}
