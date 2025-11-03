import { app, ipcMain, Menu, shell, nativeTheme } from 'electron'

import { error } from 'electron-log'

import {
    makeAppSetup,
    makeAppWithSingleInstanceLock,
    settingsCommands,
} from './factories'

import {
    MainWindow,
    PipelineTray,
    registerAboutWindowCreationByIPC,
    registerSettingsWindowCreationByIPC,
    SettingsWindow,
} from './windows'

import { buildMenuTemplate } from './menu'

import { registerStoreIPC, store } from './data/store'
import { setupFileDialogEvents } from './ipcs/fileDialogs'
import { IPC } from 'shared/constants'
import { setupShowInFolderEvents } from './ipcs/folder'
import { registerFileIPC } from './ipcs/file'
import { setupFileSystemEvents } from './ipcs/fileSystem'
import { setupOpenInBrowserEvents } from './ipcs/browser'
import { setupMessageBoxEvent, showMessageBoxYesNo } from './ipcs/messageBox'
import { APP_CONFIG } from '~/app.config'
import { getPipelineInstance } from './data/instance'
import {
    save,
    selectColorScheme,
    selectEditOnNewTab,
    setTextSize,
} from 'shared/data/slices/settings'
import {
    addJob,
    editJob,
    newJob,
    removeJob,
    selectJob,
    selectPipeline,
    selectNextJob,
    selectPrevJob,
    removeBatchJob,
    cancelBatchJob,
} from 'shared/data/slices/pipeline'
import { setupClipboardEvents } from './ipcs/clipboard'
import { checkForUpdate } from 'shared/data/slices/update'
import { setupOneTimeFetchEvent } from './ipcs/one-time-fetch'
import { DefaultTextSize, TextSizeOptions } from 'shared/types'

makeAppWithSingleInstanceLock(async () => {
    app.setName(APP_CONFIG.TITLE)
    await app.whenReady()

    registerStoreIPC()
    // load theme from settings
    nativeTheme.themeSource = selectColorScheme(store.getState())

    // Main window creation when the app is not launched in silent mode
    let mainWindow = await makeAppSetup(
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
    buildMenu()

    store.subscribe(() => {
        buildMenu()
    })
    // Note for command line parsing
    // - second-instance event is emitted when a new instance is requested
    // (that is, if we try to relaunch the app in any way, the new instance is killed
    //  and the existing one receive this event along the passed command line arguments of the killed on)
    app.on(
        'second-instance',
        (
            event,
            commandLine,
            workingDirectory,
            additionalData: { argv: string[] }
        ) => {
            // Check if a settings command is present in the command line
            for (const settingCommand of settingsCommands) {
                if (!commandLine.includes(settingCommand)) {
                    continue
                }
                const settingsWindow = SettingsWindow(`/${settingCommand}`)
                if (settingsWindow.isMinimized()) {
                    settingsWindow.restore()
                }
                settingsWindow.focus()
                return
            }
            // no settings command, continue with the main window
            const cliArgs = additionalData?.argv || []
            if (!commandLine.includes('--hidden') && cliArgs.length == 0) {
                MainWindow().then((window) => {
                    if (window.isMinimized()) {
                        window.restore()
                    }
                    window.focus()
                })
            }
        }
    )
    if (store.getState().settings.autoCheckUpdate) {
        store.dispatch(checkForUpdate())
    }
    for (const settingCommand of settingsCommands) {
        if (!process.argv.includes(settingCommand)) {
            continue
        }
        const settingsWindow = SettingsWindow(`/${settingCommand}`)
        if (settingsWindow.isMinimized()) {
            settingsWindow.restore()
        }
        settingsWindow.focus()
        break
    }

    // Parse pipeline commands
    //parsePipelineCommands(process.argv)
})

function buildMenu() {
    let jobs = selectPipeline(store.getState()).jobs

    //@ts-ignore
    let template = buildMenuTemplate({
        appName: app.name,
        jobs,
        selectedJobId: selectPipeline(store.getState()).selectedJobId,
        onCreateJob: async () => {
            const job = newJob(selectPipeline(store.getState()))
            store.dispatch(addJob(job))
            store.dispatch(selectJob(job))
            MainWindow().then((window) => {
                if (window.isMinimized()) {
                    window.restore()
                }
                window.focus()
            })
        },
        onShowSettings: async () => {
            // Open the settings window
            ipcMain.emit(IPC.WINDOWS.SETTINGS.CREATE)
        },
        onGotoLink: async (link) => {
            await shell.openExternal(link)
        },
        onNextTab: async () => {
            store.dispatch(selectNextJob(selectEditOnNewTab(store.getState())))
        },
        onPrevTab: async () => {
            store.dispatch(selectPrevJob(selectEditOnNewTab(store.getState())))
        },
        onGotoTab: async (job) => {
            store.dispatch(selectJob(job))
        },
        onRunJob: async (job) => {
            MainWindow().then((w) => w.webContents.send('submit-script-form'))
            // store.dispatch(
            //     runJob({
            //         ...job,
            //     })
            // )
        },
        onRemoveJob: async (job) => {
            if (job.isPrimaryForBatch) {
                let jobsInBatch = jobs.filter(
                    (j) => j.jobRequest?.batchId == job.jobRequest?.batchId
                )
                // Ask delete confirmation for visible jobs deletion
                let action = showMessageBoxYesNo(
                    'Are you sure you want to close these jobs?'
                )
                if (action) {
                    store.dispatch(removeBatchJob(jobsInBatch))
                }
            } else {
                let result = showMessageBoxYesNo(
                    'Are you sure you want to close this job?'
                )
                if (result) {
                    store.dispatch(removeJob(job))
                }
            }
        },
        onEditJob: async (job) => {
            store.dispatch(editJob(job))
        },
        onShowAbout: async () => {
            // Open the settings window
            ipcMain.emit(IPC.WINDOWS.ABOUT.CREATE)
        },
        onCancelBatchJob: async (jobsInBatch) => {
            store.dispatch(cancelBatchJob(jobsInBatch))
        },
        onResetTextSize: () => {
            store.dispatch(setTextSize(DefaultTextSize))
            store.dispatch(save())
        },
        onLargerText: () => {
            let textSize = store.getState().settings.textSize
            let textSizeIndex = TextSizeOptions.findIndex(
                (opt) => opt == textSize
            )
            if (textSizeIndex < TextSizeOptions.length - 1) {
                store.dispatch(setTextSize(TextSizeOptions[textSizeIndex + 1]))
                store.dispatch(save())
            }
        },
        onSmallerText: () => {
            let textSize = store.getState().settings.textSize
            let textSizeIndex = TextSizeOptions.findIndex(
                (opt) => opt == textSize
            )
            if (textSizeIndex > 0) {
                store.dispatch(setTextSize(TextSizeOptions[textSizeIndex - 1]))
                store.dispatch(save())
            }
        },
    })
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}
