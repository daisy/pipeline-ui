import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

export function pathExists(path) {
    return new Promise<boolean>((resolve, reject) => {
        // TODO look at item.mediaType to see if it's an anyFileURI or anyDirURI
        // also I think windows and mac do file vs folder browsing a little differently
        ipcRenderer.send(events.IPC_EVENT_pathExists, path)
        ipcRenderer.once(events.IPC_EVENT_pathExists, (event, res: boolean) => {
            resolve(res)
        })
    })
}
