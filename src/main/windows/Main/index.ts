import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'path'

import { ENVIRONMENT, IPC } from 'shared/constants'
import { createWindow } from 'main/factories'
import { APP_CONFIG } from '~/app.config'
import { store } from 'main/data/store'
import { ClosingMainWindowAction } from 'shared/types'
import {
    save,
    selectClosingAction,
    setClosingMainWindowAction,
} from 'shared/data/slices/settings'

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
            const closingAction = selectClosingAction(store.getState())
            if (!closingAction || closingAction == 'ask') {
                dialog
                    .showMessageBox(null, {
                        message: `The application can keep running in the tray to keep the engine alive and reload the application faster.

Do you want to stop the engine and quit the application on closing this window ?`,
                        checkboxLabel:
                            'Remember my choice (can be changed in settings)',
                        checkboxChecked: false,
                        title: 'Keep the application in tray ?',
                        type: 'info',
                        buttons: [
                            'Keep the application in tray',
                            'Stop the application',
                        ],
                    })
                    .then((result) => {
                        let action: keyof typeof ClosingMainWindowAction =
                            result.response == 0 ? 'keep' : 'close'
                        if (result.checkboxChecked) {
                            store.dispatch(setClosingMainWindowAction(action))
                            store.dispatch(save())
                            // Save result
                        }
                        if (action == 'close') {
                            app.quit()
                        }
                    })
            }

            if (closingAction == 'close') {
                app.quit()
            }
            BrowserWindow.getAllWindows().forEach((window) => window.destroy())
        })
        if (selectClosingAction(store.getState()) == undefined) {
            dialog
                .showMessageBox(mainWindow, {
                    message: `This application runs in the tray to keep the DAISY pipeline engine running in the background, and reload the application faster.

If you want to change this behaviour and also close the engine when closing the application window, you can change it in the settings of the application.`,
                    checkboxLabel: `Don't show this message again`,
                    checkboxChecked: false,
                    title: 'This application run in the system tray',
                    type: 'info',
                    buttons: ['Ok'],
                })
                .then((result) => {
                    if (result.checkboxChecked) {
                        store.dispatch(setClosingMainWindowAction('ask'))
                        store.dispatch(save())
                        // Save result
                    }
                })
        }
    }

    return mainWindow
}
