import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// get data from an arbitrary endpoint using main process fetch
export function oneTimeFetch(url) {
    return new Promise<string>((resolve, reject) => {
        ipcRenderer.once(events.IPC_EVENT_oneTimeFetch, (event, res) => {
            resolve(res)
        })
        ipcRenderer.send(events.IPC_EVENT_oneTimeFetch, url)
    })
}
