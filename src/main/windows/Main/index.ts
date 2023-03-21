import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'path'

import { ENVIRONMENT, IPC } from 'shared/constants'
import { createWindow } from 'main/factories'
import { APP_CONFIG } from '~/app.config'
import { store } from 'main/data/store'
import { ClosingMainWindowActionForApp, JobState } from 'shared/types'
import {
    save,
    selectClosingActionForApp,
    setClosingMainWindowActionForApp,
    selectClosingActionForJobs,
} from 'shared/data/slices/settings'
import {
    addJob,
    newJob,
    removeJobs,
    selectJobs,
    selectJob,
    selectNonRunningJobs,
    selectPipeline,
    selectRunningJobs,
    stop,
} from 'shared/data/slices/pipeline'

import { info } from 'electron-log'

function removeNonRunningJobs() {
    const jobsToRemove = selectNonRunningJobs(store.getState())
    const result = dialog.showMessageBoxSync(MainWindowInstance, {
        title: 'Remove non-empty jobs ?',
        message: `Jobs are going to be removed from the application.

Do you want to proceed ?`,
        buttons: ['Yes', 'No'],
    })
    if (result == 1) {
        return false
    } else {
        // Remove jobs before closing the window
        store.dispatch(removeJobs(jobsToRemove))
    }
    return true
}

let closingInterval = null
export function closeApplication() {
    if (!removeNonRunningJobs()) {
        return
    }
    if (selectRunningJobs(store.getState()).length > 0) {
        // Alert that some jobs are still running and ask if the engine should finish before closing
        dialog
            .showMessageBox(
                MainWindowInstance.isDestroyed() ? null : MainWindowInstance,
                {
                    message: `Some jobs are still running.
                    
    Do you want to wait for the jobs to complete, or quit the application immediately ?`,
                    title: 'Jobs are still running',
                    type: 'info',
                    buttons: [
                        'Complete jobs and quit',
                        'Quit the application now',
                        'Cancel',
                    ],
                }
            )
            .then((result) => {
                if (result.response == 0) {
                    // user wants to wait for the jobs to complete : wait until there is no more running jobs
                    closingInterval = setInterval(() => {
                        const runningJobs = selectRunningJobs(store.getState())
                        if (runningJobs.length == 0) {
                            setTimeout(() => {
                                info(
                                    'Stopping the pipeline has timedout, force quitting.'
                                )
                                app.quit()
                            }, 5000)
                            BrowserWindow.getAllWindows().forEach((window) =>
                                window.destroy()
                            )
                            store.dispatch(stop())
                            app.quit()
                        }
                    }, 1000)
                } else if (result.response == 1) {
                    // quit now, with a time out on app closing if stopping the pipeline takes too long
                    setTimeout(() => {
                        info(
                            'Stopping the pipeline has timedout, force quitting'
                        )
                        app.quit()
                    }, 5000)
                    BrowserWindow.getAllWindows().forEach((window) =>
                        window.destroy()
                    )
                    store.dispatch(stop(true))
                    app.quit()
                }
            })
    } else {
        setTimeout(() => {
            info('Stopping the pipeline has timedout, force quitting')
            app.quit()
        }, 5000)
        BrowserWindow.getAllWindows().forEach((window) => window.destroy())
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
            // Check for confirmation on closing the app or not
            const closingActionForApp = selectClosingActionForApp(
                store.getState()
            )
            if (!closingActionForApp || closingActionForApp == 'ask') {
                dialog
                    .showMessageBox(MainWindowInstance, {
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
                            } else {
                                MainWindowInstance.destroy()
                            }
                        } else if (
                            (!closingActionForJobs ||
                                closingActionForJobs == 'close') &&
                            selectJobs(store.getState()).length == 0
                        ) {
                            const _emptyJob = newJob(
                                selectPipeline(store.getState())
                            )
                            store.dispatch(addJob(_emptyJob))
                            store.dispatch(selectJob(_emptyJob))
                        }
                    })
            } else if (closingActionForApp == 'close') {
                closeApplication()
            } else if (
                !closingActionForJobs ||
                closingActionForJobs == 'close'
            ) {
                if (removeNonRunningJobs()) MainWindowInstance.destroy()
            } else {
                MainWindowInstance.destroy()
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
