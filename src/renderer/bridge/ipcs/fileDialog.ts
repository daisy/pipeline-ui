import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// options: { title, buttonLabel, properties, filters }
export function showOpenFileDialog(options: {
    dialogOptions: Electron.OpenDialogOptions
    asFileURL?: boolean
}) {
    return new Promise<string>((resolve, reject) => {
        // TODO look at item.mediaType to see if it's an anyFileURI or anyDirURI
        // also I think windows and mac do file vs folder browsing a little differently
        ipcRenderer.send(events.IPC_EVENT_showOpenFileDialog, options)
        ipcRenderer.once(
            events.IPC_EVENT_showOpenFileDialog,
            (event, filepath: string) => {
                resolve(filepath)
            }
        )
    })
}
