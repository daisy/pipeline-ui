import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

export type ExternalFileOpenData = {
    filePath: string
    scriptIdFragment: string
    autoRun: boolean
}

export function onExternalFileOpen(
    listener: (data: ExternalFileOpenData) => void
) {
    ipcRenderer.on(events.IPC_EVENT_openExternalFile, (_, data) =>
        listener(data)
    )
}
