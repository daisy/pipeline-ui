import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// get JSON data from an arbitrary endpoint
export function oneTimeFetch(url) {
    return new Promise<JSON>((resolve, reject) => {
        ipcRenderer.send(events.IPC_EVENT_oneTimeFetch, url)
        ipcRenderer.once(events.IPC_EVENT_oneTimeFetch, (event, res: JSON) => {
            resolve(res)
        })
    })
}
