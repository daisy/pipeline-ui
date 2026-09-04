import { app } from 'electron'
import type { BrowserWindow } from 'electron'
import * as fs from 'fs-extra'

import { MainWindow } from './windows'
import { showMessageBoxYesNo } from './ipcs/messageBox'
import { sniffFile } from './ipcs/sniffFile'
import { IPC_EVENT_openExternalFile } from 'shared/main-renderer-events'
import type { ExternalFileOpenData } from 'shared/main-renderer-events'

type FileOpenAction = ExternalFileOpenData['action']
type ExternalFileOpenRequest = {
    filePath: string
    action: FileOpenAction
}

const openWithExtensions = ['.epub', '.opf', '.docx']

let pendingOpenFile: ExternalFileOpenRequest | null = null

export function registerExternalFileOpenEvents() {
    app.on('open-file', (event, filePath) => {
        event.preventDefault()
        pendingOpenFile = { filePath, action: 'open' }
        if (app.isReady()) {
            pendingOpenFile = null
            handleFileOpen(filePath, true, 'open')
        }
    })
}

export function captureExternalFileOpenFromArgv(argv: string[]) {
    const externalFileOpen = parseExternalFileOpen(argv)
    if (externalFileOpen) {
        pendingOpenFile = externalFileOpen
    }
}

export function openPendingExternalFile(appWasAlreadyOpen: boolean) {
    if (!pendingOpenFile) {
        return
    }

    const { filePath, action } = pendingOpenFile
    pendingOpenFile = null
    handleFileOpen(filePath, appWasAlreadyOpen, action)
}

export function parseExternalFileOpen(
    argv: string[]
): ExternalFileOpenRequest | null {
    const filePath = parseFileArg(argv)
    if (!filePath) {
        return null
    }

    return {
        filePath,
        action: parseActionArg(argv),
    }
}

function parseFileArg(argv: string[]): string | null {
    return (
        argv.find(
            (arg) =>
                !arg.startsWith('--') &&
                isOpenWithFilePath(arg) &&
                fs.existsSync(arg)
        ) ?? null
    )
}

function isOpenWithFilePath(filePath: string) {
    const lowerPath = filePath.toLowerCase()
    return (
        openWithExtensions.some((ext) => lowerPath.endsWith(ext)) ||
        lowerPath.endsWith('/ncc.html') ||
        lowerPath.endsWith('\\ncc.html') ||
        lowerPath === 'ncc.html' ||
        lowerPath.endsWith('/dtbook.xml') ||
        lowerPath.endsWith('\\dtbook.xml') ||
        lowerPath === 'dtbook.xml'
    )
}

function parseActionArg(argv: string[]): FileOpenAction {
    return argv.includes('--action=validate') ? 'validate' : 'open'
}

function openFileInRenderer(filePath: string) {
    MainWindow().then((w) =>
        sendOpenFileToRenderer(w, { action: 'open', filePath })
    )
}

function validateFileInRenderer(
    filePath: string,
    scriptIdFragment: string,
    autoRun: boolean
) {
    MainWindow().then((w) =>
        sendOpenFileToRenderer(w, {
            action: 'validate',
            filePath,
            scriptIdFragment,
            autoRun,
        })
    )
}

export async function handleFileOpen(
    filePath: string,
    appWasAlreadyOpen: boolean,
    action: FileOpenAction
) {
    if (action === 'open') {
        openFileInRenderer(filePath)
        return
    }

    const fileType = await sniffFile(filePath)

    if (fileType === 'epub2opf') {
        const openUpgrader = showMessageBoxYesNo(
            'This is an EPUB 2 file. The EPUB Validator only supports EPUB 3.\n\nWould you like to open the EPUB Upgrader to convert it to EPUB 3 first?'
        )
        if (!openUpgrader) {
            if (!appWasAlreadyOpen) {
                app.quit()
            }
            return
        }
        validateFileInRenderer(filePath, 'epub2-to-epub3', false)
        return
    }

    if (fileType === 'epub3opf') {
        validateFileInRenderer(filePath, 'epub3-validator', true)
        return
    }

    if (fileType === 'ncc') {
        validateFileInRenderer(filePath, 'daisy202-validator', true)
        return
    }

    if (fileType === 'dtbook') {
        validateFileInRenderer(filePath, 'dtbook-validator', true)
        return
    }

    openFileInRenderer(filePath)
}

async function sendOpenFileToRenderer(
    w: BrowserWindow,
    data: ExternalFileOpenData
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

    w.webContents.send(IPC_EVENT_openExternalFile, data)
}
