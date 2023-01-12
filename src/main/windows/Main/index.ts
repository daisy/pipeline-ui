import { app, BrowserWindow } from 'electron'
import { join } from 'path'

import { ENVIRONMENT, IPC } from 'shared/constants'
import { createWindow, Pipeline2IPC } from 'main/factories'
import { APP_CONFIG } from '~/app.config'
import { store } from 'main/data/store'

const { MAIN, TITLE } = APP_CONFIG

export async function MainWindow() {
    const window = createWindow({
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

    ENVIRONMENT.IS_DEV && window.webContents.openDevTools({ mode: 'detach' })

    const unsubscribe = store.subscribe(() => {
        const state = store.getState()
        window.webContents.send(IPC.STORE.UPDATED, state)
    })

    window.on('close', (event) => {
        unsubscribe()
        BrowserWindow.getAllWindows().forEach((window) => window.destroy())
    })

    return window
}
