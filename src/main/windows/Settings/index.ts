import { store } from 'main/data/store'
import { createWindow } from 'main/factories'
import { join } from 'path'
import { ENVIRONMENT, IPC } from 'shared/constants'
import { APP_CONFIG } from '~/app.config'

export * from './ipcs'

export function SettingsWindow() {
    const window = createWindow({
        id: 'settings',
        title: `${APP_CONFIG.TITLE} - Settings`,
        width: 800,
        height: 450,
        resizable: true,
        alwaysOnTop: true,

        webPreferences: {
            preload: join(__dirname, 'bridge.js'),
            nodeIntegration: false,
            contextIsolation: true,
            spellcheck: false,
            sandbox: false,
        },
    })

    const unsubscribe = store.subscribe(() => {
        const state = store.getState()
        window.webContents.send(IPC.STORE.UPDATED, state)
    })

    ENVIRONMENT.IS_DEV && window.webContents.openDevTools({ mode: 'detach' })

    window.on('close', (event) => {
        unsubscribe()
    })

    return window
}
