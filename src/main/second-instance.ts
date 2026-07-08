import { app } from 'electron'

import {
    isCliCommand,
    parseCommandLineArgs,
    settingsCommands,
} from './factories'
import { MainWindow, SettingsWindow } from './windows'
import { handleFileOpen, parseExternalFileOpen } from './external-file-open'

export function registerSecondInstanceHandler() {
    // The second-instance event is emitted when a new instance is requested.
    // The new instance is killed, and the existing one receives its command line.
    app.on('second-instance', (_event, commandLine) => {
        if (openSettingsCommandFromArgv(commandLine)) {
            return
        }

        // Derive args from commandLine, not additionalData. See the
        // requestSingleInstanceLock note in factories/app/instance.ts.
        const cliArgs = parseCommandLineArgs(commandLine)

        // Only open a file when this wasn't a dp2 command launch, so an
        // .epub/.opf passed as a script param value isn't opened as a file.
        if (!isCliCommand(cliArgs)) {
            const externalFileOpen = parseExternalFileOpen(commandLine)
            if (externalFileOpen) {
                MainWindow().then(() => {
                    handleFileOpen(
                        externalFileOpen.filePath,
                        true,
                        externalFileOpen.action
                    )
                })
                return
            }
        }

        // Plain relaunch: focus the existing window. Using !isCliCommand rather
        // than a length check tolerates Electron-injected commandLine flags.
        if (!commandLine.includes('--hidden') && !isCliCommand(cliArgs)) {
            focusMainWindow()
        }
    })
}

export function openSettingsCommandFromArgv(argv: string[]) {
    for (const settingCommand of settingsCommands) {
        if (!argv.includes(settingCommand)) {
            continue
        }

        focusSettingsWindow(settingCommand)
        return true
    }

    return false
}

function focusSettingsWindow(settingCommand: string) {
    const settingsWindow = SettingsWindow(`/${settingCommand}`)
    if (settingsWindow.isMinimized()) {
        settingsWindow.restore()
    }
    settingsWindow.focus()
}

function focusMainWindow() {
    MainWindow().then((window) => {
        if (window.isMinimized()) {
            window.restore()
        }
        window.focus()
    })
}
