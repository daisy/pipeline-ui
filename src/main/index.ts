import { app, BrowserWindow } from 'electron'

import { error } from 'electron-log'

import {
    bindWindowToPipeline,
    makeAppSetup,
    makeAppWithSingleInstanceLock,
    Pipeline2IPC,
    registerPipeline2ToIPC,
} from './factories'
import {
    MainWindow,
    registerAboutWindowCreationByIPC,
    PipelineTray,
} from './windows'
import { setupFileDialogEvents } from './fileDialogs'
import { IPC } from 'shared/constants'
import { setupClipboardEvents } from './clipboard'

makeAppWithSingleInstanceLock(async () => {
    await app.whenReady()
    const pipelineInstance = new Pipeline2IPC()
    const mainWindow = await makeAppSetup(MainWindow)

    let tray: PipelineTray = null
    try {
        pipelineInstance
            .launch()
            .then((state) => {
                mainWindow.webContents.send(IPC.PIPELINE.STATE.CHANGED, state)
            })
            .catch((err) => {
                error(err)
                throw err
            })
        tray = new PipelineTray(mainWindow, null, pipelineInstance)
    } catch (err) {
        error(err)
        // quit app for now but we might need to think for a better handling for the user
        app.quit()
    }

    registerAboutWindowCreationByIPC()
    registerPipeline2ToIPC(pipelineInstance)
    bindWindowToPipeline(mainWindow, pipelineInstance)
    setupFileDialogEvents()
    setupClipboardEvents()
})
