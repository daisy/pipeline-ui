import { createWindow } from 'main/factories'
import { join } from 'path'
import { APP_CONFIG } from '~/app.config'

export * from './ipcs'

export function SettingsWindow() {
    const window = createWindow({
        id: 'settings',
        title: `${APP_CONFIG.TITLE} - Settings`,
        width: 450,
        height: 350,
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

    return window
}
