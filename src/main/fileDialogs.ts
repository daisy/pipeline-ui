import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { pathToFileURL } from 'node:url'

// helper functions
import {
    IPC_EVENT_showItemInFolder,
    IPC_EVENT_showOpenFileDialog,
} from '../shared/main-renderer-events'

/*
dialogOptions: https://www.electronjs.org/docs/latest/api/dialog
{
    title: the title of the dialog
    buttonLabel: 'Open', 'Select', 'Whatever'
    properties: [] 'openFile', 'openDirectory', 'createDirectory'
    filters: [ {label, rule}, ... ]
}
*/

const showOpenFileDialog = async (
    callback: (filepath: string) => void,
    dialogOptions: Electron.OpenDialogOptions,
    asFileURL: boolean = true
): Promise<void> => {
    let filePath
    const res = await dialog.showOpenDialog(
        BrowserWindow ? BrowserWindow.getFocusedWindow() : undefined,
        dialogOptions
    )
    if (res.canceled || !res.filePaths || !res.filePaths.length) {
        filePath = undefined
    }
    if (res.filePaths[0]) {
        filePath = asFileURL
            ? pathToFileURL(res.filePaths[0]).href
            : res.filePaths[0]
    } else {
        filePath = undefined
    }
    if (callback && filePath) {
        console.log('Selected', filePath)
        callback(filePath)
    }
}

function setupFileDialogEvents() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.on(IPC_EVENT_showOpenFileDialog, async (event, payload) => {
        await showOpenFileDialog(
            (filePath) => {
                event.sender.send(IPC_EVENT_showOpenFileDialog, filePath)
            },
            payload.dialogOptions,
            payload.getFileURL
        )
    })
}
export { setupFileDialogEvents, showOpenFileDialog }

// not used at the moment but probably will need this later
async function showSaveDialog(options) {
    const res = await dialog.showSaveDialog(
        BrowserWindow ? BrowserWindow.getFocusedWindow() : undefined,
        options
    )
    if (res.canceled || !res.filePath) {
        return undefined
    }
    return res.filePath
}
