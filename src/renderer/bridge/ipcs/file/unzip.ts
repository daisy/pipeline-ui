import { ipcRenderer } from 'electron'

import { IPC } from 'shared/constants'

export function unzipFile(buffer, path) {
    const channel = IPC.FILE.UNZIP

    return ipcRenderer.invoke(channel, buffer, path)
}
