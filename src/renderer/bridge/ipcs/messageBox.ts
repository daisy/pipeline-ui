import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// options: { title, buttonLabel, properties, filters }
export async function showMessageBoxYesNo(msg) {
    return new Promise<string[]>((resolve, reject) => {
        ipcRenderer.send(events.IPC_EVENT_messageBoxYesNo, msg)
        ipcRenderer.once(events.IPC_EVENT_messageBoxYesNo, (event, result) => {
            resolve(result)
        })
    })
}
