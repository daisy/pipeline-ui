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
import {
    addJob,
    newJob,
    pipeline,
    selectJob,
    selectPipeline,
    selectJobs,
    selectNextJob,
    selectPrevJob,
} from 'shared/data/slices/pipeline'

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
    
    buildMenu(mainWindow, pipelineInstance)

    store.subscribe(() => {
        console.log('store update')
        buildMenu(mainWindow, pipelineInstance)
    })
})

function buildMenu(mainWindow, pipelineInstance) {
    let jobs = selectPipeline(store.getState()).jobs

    //@ts-ignore
    let template = buildMenuTemplate({
        appName: app.name,
        jobs,
        onCreateJob: async () => {
            const job = newJob(selectPipeline(store.getState()))
            store.dispatch(addJob(job))
            store.dispatch(selectJob(job))
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
        onNextTab: async () => {
            store.dispatch(selectNextJob())
        },
        onPrevTab: async () => {
            store.dispatch(selectPrevJob())
        },
        onGotoTab: async (job) => {
            console.log('goto tab', job)
            store.dispatch(selectJob(job))
        },
    })
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}