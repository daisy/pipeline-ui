import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// options: { title, buttonLabel, properties, filters }
export function showOpenFileDialog(options) {
    return new Promise((resolve, reject) => {
        console.log('hello from bridge showOpenFileDialog')
        // TODO look at item.mediaType to see if it's an anyFileURI or anyDirURI
        // also I think windows and mac do file vs folder browsing a little differently
        ipcRenderer.send(events.IPC_EVENT_showOpenFileDialog, options)
        ipcRenderer.once(
            events.IPC_EVENT_showOpenFileDialog,
            (event, filepath) => {
                resolve(filepath)
            }
        )
    })
}
