import {
    app,
    BrowserWindow,
    nativeTheme,
} from 'electron'

import { error, info, warn } from 'electron-log'
import * as fs from 'fs-extra'

import {
    isCliCommand,
    makeAppSetup,
    makeAppWithSingleInstanceLock,
    parseCommandLineArgs,
    settingsCommands,
} from './factories'

import {
    MainWindow,
    PipelineTray,
    registerAboutWindowCreationByIPC,
    registerSettingsWindowCreationByIPC,
    SettingsWindow,
} from './windows'

import { registerStoreIPC, store } from './data/store'
import { setupFileDialogEvents } from './ipcs/fileDialogs'
import { setupShowInFolderEvents } from './ipcs/folder'
import { registerFileIPC } from './ipcs/file'
import { setupFileSystemEvents } from './ipcs/fileSystem'
import { setupOpenInBrowserEvents } from './ipcs/browser'
import { setupMessageBoxEvent, showMessageBoxYesNo } from './ipcs/messageBox'
import { APP_CONFIG } from '~/app.config'
import { getPipelineInstance } from './data/instance'
import { selectColorScheme } from 'shared/data/slices/settings'
import { setupClipboardEvents } from './ipcs/clipboard'
import { checkForUpdate } from 'shared/data/slices/update'
import { setupOneTimeFetchEvent } from './ipcs/one-time-fetch'
import { buildApplicationMenu } from './application-menu'
import { sniffFile } from './ipcs/sniffFile'
import { IPC_EVENT_openExternalFile } from 'shared/main-renderer-events'

let pendingOpenFile: string | null = null
function registerProcessDiagnostics() {
    process.on('uncaughtException', (err) => {
        error('main process uncaughtException', err)
    })
    process.on('unhandledRejection', (reason) => {
        error('main process unhandledRejection', reason)
    })
    process.on('warning', (warning) => {
        warn('main process warning', warning)
    })
    app.on('render-process-gone', (_event, webContents, details) => {
        error('render process gone', {
            reason: details.reason,
            exitCode: details.exitCode,
            url: webContents.getURL(),
        })
    })
    app.on('child-process-gone', (_event, details) => {
        error('child process gone', details)
    })
    app.on('before-quit', () => {
        info('app before-quit')
    })
    app.on('will-quit', () => {
        info('app will-quit')
    })
}

registerProcessDiagnostics()

app.on('open-file', (event, filePath) => {
    event.preventDefault()
    pendingOpenFile = filePath
    if (app.isReady()) {
        pendingOpenFile = null
        handleFileOpen(filePath, true)
    }
})

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
    buildApplicationMenu()

    const fileArg = parseFileArg(process.argv)
    if (fileArg) {
        pendingOpenFile = fileArg
    }
    if (pendingOpenFile) {
        const filePath = pendingOpenFile
        pendingOpenFile = null
        handleFileOpen(filePath, false)
    }

    store.subscribe(() => {
        buildApplicationMenu()
    })
    // Note for command line parsing
    // - second-instance event is emitted when a new instance is requested
    // (that is, if we try to relaunch the app in any way, the new instance is killed
    //  and the existing one receive this event along the passed command line arguments of the killed on)
    app.on(
        'second-instance',
        (event, commandLine) => {
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
            // no settings command, continue with the main window.
            // Derive the args from `commandLine` (NOT additionalData — see the
            // requestSingleInstanceLock note in instance.ts).
            const cliArgs = parseCommandLineArgs(commandLine)
            // Only open a file when this wasn't a dp2 command launch, so an
            // .epub/.opf passed as a script param value isn't opened as a file.
            if (!isCliCommand(cliArgs)) {
                const file = parseFileArg(commandLine)
                if (file) {
                    MainWindow().then(() => {
                        handleFileOpen(file, true)
                    })
                    return
                }
            }

            // Plain relaunch (no dp2 command): just focus the existing window.
            // Using !isCliCommand rather than a length check tolerates the extra
            // flags Electron injects into commandLine for second instances.
            if (!commandLine.includes('--hidden') && !isCliCommand(cliArgs)) {
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

function parseFileArg(argv: string[]): string | null {
    return (
        argv.find(
            (arg) =>
                !arg.startsWith('--') &&
                ['.epub', '.opf'].some((ext) =>
                    arg.toLowerCase().endsWith(ext)
                ) &&
                fs.existsSync(arg)
        ) ?? null
    )
}

async function handleFileOpen(
    filePath: string,
    appWasAlreadyOpen: boolean
) {
    const epubType = await sniffFile(filePath)

    if (epubType === 'epub2opf') {
        const openUpgrader = showMessageBoxYesNo(
            'This is an EPUB 2 file. The EPUB Validator only supports EPUB 3.\n\nWould you like to open the EPUB Upgrader to convert it to EPUB 3 first?'
        )
        if (!openUpgrader) {
            if (!appWasAlreadyOpen) {
                app.quit()
            }
            return
        }
        MainWindow().then((w) =>
            sendOpenFileToRenderer(w, filePath, 'epub2-to-epub3', false)
        )
        return
    }

    if (epubType === 'epub3opf') {
        MainWindow().then((w) =>
            sendOpenFileToRenderer(w, filePath, 'epub3-validator', true)
        )
    }
}

async function sendOpenFileToRenderer(
    w: BrowserWindow,
    filePath: string,
    scriptIdFragment: string,
    autoRun: boolean
) {
    if (w.isMinimized()) {
        w.restore()
    }
    w.show()
    w.focus()

    if (w.webContents.isLoading()) {
        await new Promise<void>((resolve) => {
            w.webContents.once('did-finish-load', () => resolve())
        })
    }

    w.webContents.send(IPC_EVENT_openExternalFile, {
        filePath,
        scriptIdFragment,
        autoRun,
    })
}
