import { app, ipcMain } from 'electron'
import { getPipelineInstance } from 'main/data/instance'
import { store } from 'main/data/store'
import { IPC } from 'shared/constants'

export function setupAppEvents() {
    ipcMain.handle(IPC.APP.RESTART, async () => {
        await getPipelineInstance(store.getState())?.stop(true)
        app.relaunch()
        app.exit(0)
    })
}
