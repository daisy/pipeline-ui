import { app, nativeTheme } from 'electron'

import { error } from 'electron-log'

import { makeAppSetup, makeAppWithSingleInstanceLock } from './factories'

import {
    MainWindow,
    PipelineTray,
    registerAboutWindowCreationByIPC,
    registerSettingsWindowCreationByIPC,
} from './windows'

import { registerStoreIPC, store } from './data/store'
import { setupFileDialogEvents } from './ipcs/fileDialogs'
import { setupShowInFolderEvents } from './ipcs/folder'
import { registerFileIPC } from './ipcs/file'
import { setupFileSystemEvents } from './ipcs/fileSystem'
import { setupOpenInBrowserEvents } from './ipcs/browser'
import { setupMessageBoxEvent } from './ipcs/messageBox'
import { APP_CONFIG } from '~/app.config'
import { getPipelineInstance } from './data/instance'
import { selectColorScheme } from 'shared/data/slices/settings'
import { setupClipboardEvents } from './ipcs/clipboard'
import { checkForUpdate } from 'shared/data/slices/update'
import { setupOneTimeFetchEvent } from './ipcs/one-time-fetch'
import { buildApplicationMenu } from './application-menu'
import {
    captureExternalFileOpenFromArgv,
    openPendingExternalFile,
    registerExternalFileOpenEvents,
} from './external-file-open'
import { registerProcessDiagnostics } from './process-diagnostics'
import {
    openSettingsCommandFromArgv,
    registerSecondInstanceHandler,
} from './second-instance'

registerProcessDiagnostics()
registerExternalFileOpenEvents()

makeAppWithSingleInstanceLock(async () => {
    app.setName(APP_CONFIG.TITLE)
    await app.whenReady()

    registerStoreIPC()
    // load theme from settings
    nativeTheme.themeSource = selectColorScheme(store.getState())

    // Main window creation when the app is not launched in silent mode
    await makeAppSetup(
        !process.argv.includes('--hidden') ? MainWindow : async () => null
    )

    registerSettingsWindowCreationByIPC()
    registerAboutWindowCreationByIPC()
    registerFileIPC()

    // Pipeline instance creation
    // IPC is managed by the store
    const pipelineInstance = getPipelineInstance(store.getState())
    pipelineInstance.launch()

    let tray: PipelineTray = null
    try {
        tray = new PipelineTray()
    } catch (err) {
        error(err)
        // quit app for now but we might need to think for a better handling for the user
        app.quit()
    }
    setupFileDialogEvents()
    setupShowInFolderEvents()
    setupOpenInBrowserEvents()
    setupFileSystemEvents()
    setupClipboardEvents()
    setupOneTimeFetchEvent()
    setupMessageBoxEvent()
    buildApplicationMenu()

    captureExternalFileOpenFromArgv(process.argv)
    openPendingExternalFile(false)

    store.subscribe(() => {
        buildApplicationMenu()
    })
    registerSecondInstanceHandler()

    if (store.getState().settings.autoCheckUpdate) {
        store.dispatch(checkForUpdate())
    }
    openSettingsCommandFromArgv(process.argv)

    // Parse pipeline commands
    //parsePipelineCommands(process.argv)
})
