import { app, BrowserWindow } from 'electron'
import { join } from 'path'

import { ENVIRONMENT, IPC } from 'shared/constants'
import { createWindow } from 'main/factories'
import { APP_CONFIG } from '~/app.config'
import { store } from 'main/data/store'

const { MAIN, TITLE } = APP_CONFIG
let mainWindow: BrowserWindow = null

export async function MainWindow() {
    if (mainWindow == null || mainWindow.isDestroyed()) {
        mainWindow = createWindow({
            id: 'main',
            title: TITLE,
            width: MAIN.WINDOW.WIDTH,
            height: MAIN.WINDOW.HEIGHT,
            center: true,
            movable: true,
            resizable: true,
            alwaysOnTop: false,
            webPreferences: {
                preload: join(__dirname, 'bridge.js'),
                nodeIntegration: false,
                contextIsolation: true,
                spellcheck: false,
                sandbox: false,
            },
        })
        ENVIRONMENT.IS_DEV &&
            mainWindow.webContents.openDevTools({ mode: 'detach' })

        mainWindow.on('close', (event) => {
            BrowserWindow.getAllWindows().forEach((window) => window.destroy())
        })
    }

    return mainWindow
}
