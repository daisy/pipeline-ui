import { ipcRenderer } from 'electron'
import { IPC } from 'shared/constants'

export function restartApplication() {
    return ipcRenderer.invoke(IPC.APP.RESTART)
}
