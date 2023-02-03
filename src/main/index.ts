import {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    MenuItemConstructorOptions,
    shell,
    nativeTheme,
} from 'electron'

import { error } from 'electron-log'

import {
    bindWindowToPipeline,
    makeAppSetup,
    makeAppWithSingleInstanceLock,
    registerApplicationSettingsIPC,
    registerPipeline2ToIPC,
} from './factories'

import {
    MainWindow,
    PipelineTray,
    registerAboutWindowCreationByIPC,
    registerSettingsWindowCreationByIPC,
} from './windows'

import { buildMenuTemplate } from './menu'

import { registerStoreIPC, store } from './data/store'
import { setupFileDialogEvents } from './fileDialogs'
import { ENVIRONMENT, IPC } from 'shared/constants'
import { setupShowInFolderEvents } from './folder'
import { registerFileIPC } from './factories/ipcs/file'
import { setupFileSystemEvents } from './fileSystem'
import { setupOpenInBrowserEvents } from './browser'
import { APP_CONFIG } from '~/app.config'
import { getPipelineInstance } from './data/middlewares/pipeline'
import { selectColorScheme, selectSettings } from 'shared/data/slices/settings'

makeAppWithSingleInstanceLock(async () => {
    await app.whenReady()
    registerStoreIPC()
    // load theme from settings
    nativeTheme.themeSource = selectColorScheme(store.getState())

    // Windows
    let mainWindow = await makeAppSetup(MainWindow)

    registerSettingsWindowCreationByIPC()
    registerAboutWindowCreationByIPC()
    registerFileIPC()

    // Pipeline instance creation
    // IPC is managed by the store
    const pipelineInstance = getPipelineInstance(store.getState())
    pipelineInstance.launch()

    bindWindowToPipeline(mainWindow, pipelineInstance)

    let tray: PipelineTray = null
    try {
        tray = new PipelineTray(mainWindow)
    } catch (err) {
        error(err)
        // quit app for now but we might need to think for a better handling for the user
        app.quit()
    }
    setupFileDialogEvents()
    setupShowInFolderEvents()
    setupOpenInBrowserEvents()
    setupFileSystemEvents()

    // TODO recreate the menu on store changes
    //@ts-ignore
    let template = buildMenuTemplate({
        appName: app.name,
        onCreateJob: async () => {
            try {
                mainWindow.show()
            } catch (error) {
                mainWindow = await MainWindow()
                bindWindowToPipeline(mainWindow, pipelineInstance)
            }
        },
        onShowSettings: async () => {
            // Open the settings window
            ipcMain.emit(IPC.WINDOWS.SETTINGS.CREATE)
        },
        onLearnMore: async () => {
            await shell.openExternal('https://daisy.github.io/pipeline/')
        },
        onUserGuide: async () => {
            await shell.openExternal(
                'https://daisy.github.io/pipeline/Get-Help/'
            )
        },
    })
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
})
