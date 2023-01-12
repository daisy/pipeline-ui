import { BrowserWindow, ipcMain } from 'electron'
import { ApplicationSettings } from 'shared/types'
import { IPC } from 'shared/constants'

import { store } from 'main/data/store'
import { setSettings } from 'shared/data/slices/settings'
import { selectSettings } from 'shared/data/slices'

export function registerApplicationSettingsIPC(): ApplicationSettings {
    // get state from the instance
    ipcMain.handle(IPC.WINDOWS.SETTINGS.GET, (event) => {
        return selectSettings(store.getState())
    })

    ipcMain.on(IPC.WINDOWS.SETTINGS.UPDATE, (event, newSettings) => {
        store.dispatch(setSettings(newSettings))
        BrowserWindow.getAllWindows().forEach((window) => {
            window.webContents.send(
                IPC.WINDOWS.SETTINGS.CHANGED,
                selectSettings(store.getState())
            )
        })
    })

    return selectSettings(store.getState())
}
