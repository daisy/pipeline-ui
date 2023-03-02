import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'path'

import { ENVIRONMENT, IPC } from 'shared/constants'
import { createWindow } from 'main/factories'
import { APP_CONFIG } from '~/app.config'
import { store } from 'main/data/store'
import { ClosingMainWindowActionForApp } from 'shared/types'
import {
    save,
    selectClosingActionForApp,
    setClosingMainWindowActionForApp,
    selectClosingActionForJobs,
} from 'shared/data/slices/settings'
import {
    removeJobs,
    selectNonRunningJobs,
    selectRunningJobs,
    stop,
} from 'shared/data/slices/pipeline'

let closingInterval = null
export function closeApplication() {
    BrowserWindow.getAllWindows().forEach((window) => window.destroy())
    if (selectRunningJobs(store.getState()).length > 0) {
        // Alert that some jobs are still running and ask if the engine should finish before closing
        dialog
            .showMessageBox(null, {
                message: `The application can keep running in the tray to keep the engine running and reload the application faster.

    Do you want to stop the engine and quit the application on closing this window ?`,
                title: 'Jobs are still running',
                type: 'info',
                buttons: ['Wait before closing', 'Force close the application'],
            })
            .then((result) => {
                if (result.response == 0) {
                    // and request if the user wants to wait for the jobs to complete
                    closingInterval = setInterval(() => {
                        const runningJobs = selectRunningJobs(store.getState())
                        if (runningJobs.length == 0) {
                            store.dispatch(stop())
                            app.quit()
                        }
                    }, 1000)
                } else {
                    store.dispatch(stop(true))
                    app.quit()
                }
            })
    } else {
        store.dispatch(stop(true))
        app.quit()
    }
}

const { MAIN, TITLE } = APP_CONFIG

export let MainWindowInstance: BrowserWindow = null

export async function MainWindow() {
    if (closingInterval != null) {
        // disable the interval that was waiting for job to finish before closing
        clearInterval(closingInterval)
    }
    if (MainWindowInstance == null || MainWindowInstance.isDestroyed()) {
        MainWindowInstance = createWindow({
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
            MainWindowInstance.webContents.openDevTools({ mode: 'detach' })

        MainWindowInstance.on('close', (event) => {
            event.preventDefault()
            const closingActionForJobs = selectClosingActionForJobs(
                store.getState()
            )
            if (!closingActionForJobs || closingActionForJobs == 'close') {
                // dispatch the removal of non-running jobs
                const jobsToRemove = selectNonRunningJobs(store.getState())
                store.dispatch(removeJobs(jobsToRemove))
                // If all targetted jobs have been deleted
                // (meaning the action has completed)
                const remaingNonRunningJobs = selectNonRunningJobs(
                    store.getState()
                )
                if (remaingNonRunningJobs.length > 0) {
                    // abort closing
                    return
                }
            }
            // Close the main window
            MainWindowInstance.destroy()
            // Check for confirmation on closing the app or not
            const closingActionForApp = selectClosingActionForApp(
                store.getState()
            )
            if (!closingActionForApp || closingActionForApp == 'ask') {
                dialog
                    .showMessageBox(null, {
                        message: `The application can keep running in the tray to keep the engine running and reload the application faster.

Do you want to stop the engine and quit the application on closing this window ?`,
                        checkboxLabel:
                            'Remember my choice (can be changed in settings)',
                        checkboxChecked: false,
                        title: 'Keep the application in tray ?',
                        type: 'info',
                        buttons: [
                            'Keep the application in tray',
                            'Stop the application',
                            'Cancel',
                        ],
                    })
                    .then((result) => {
                        if (result.response < 2) {
                            let action: keyof typeof ClosingMainWindowActionForApp =
                                result.response == 0 ? 'keep' : 'close'
                            if (result.checkboxChecked) {
                                store.dispatch(
                                    setClosingMainWindowActionForApp(action)
                                )
                                store.dispatch(save())
                                // Save result
                            }
                            if (action == 'close') {
                                closeApplication()
                            }
                        }
                    })
            } else if (closingActionForApp == 'close') {
                closeApplication()
            }
        })

        if (selectClosingActionForApp(store.getState()) == undefined) {
            dialog
                .showMessageBox(MainWindowInstance, {
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
                        store.dispatch(setClosingMainWindowActionForApp('ask'))
                        store.dispatch(save())
                        // Save result
                    }
                })
        }
    }

    return MainWindowInstance
}
