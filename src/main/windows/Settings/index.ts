import { BrowserWindow } from 'electron'
import { createWindow } from 'main/factories'
import { join } from 'path'
import { ENVIRONMENT, IPC } from 'shared/constants'
import { APP_CONFIG } from '~/app.config'

export * from './ipcs'

export let SettingsWindowInstance: BrowserWindow = null

export function SettingsWindow(hash: string = '') {
    if (SettingsWindowInstance && !SettingsWindowInstance.isDestroyed()) {
        SettingsWindowInstance.show()
        SettingsWindowInstance.focus()
        SettingsWindowInstance.webContents.executeJavaScript(`
                window.location.hash = '#/settings${hash}';
        `)
        return SettingsWindowInstance
    }
    SettingsWindowInstance = createWindow(
        {
            id: 'settings',
            title: `${APP_CONFIG.TITLE} - Settings`,
            width: 1000,
            height: 800,
            resizable: true,
            alwaysOnTop: false,

            webPreferences: {
                preload: join(__dirname, 'bridge.js'),
                nodeIntegration: false,
                contextIsolation: true,
                spellcheck: false,
                sandbox: false,
            },
        },
        hash
    )
    SettingsWindowInstance.menuBarVisible = false

    ENVIRONMENT.IS_DEV &&
        SettingsWindowInstance.webContents.openDevTools({ mode: 'detach' })

    return SettingsWindowInstance
}
