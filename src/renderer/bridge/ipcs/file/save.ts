import { ipcRenderer } from 'electron'

import { IPC } from 'shared/constants'

export function saveFile(buffer, path) {
    const channel = IPC.FILE.SAVE

    return ipcRenderer.invoke(channel, buffer, path)
}
