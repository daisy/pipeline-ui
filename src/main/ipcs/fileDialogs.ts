import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { pathToFileURL } from 'node:url'

// helper functions
import {
    IPC_EVENT_showItemInFolder,
    IPC_EVENT_showOpenFileDialog,
} from '../../shared/main-renderer-events'

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
    dialogOptions: Electron.OpenDialogOptions,
    asFileURL: boolean = true
): Promise<void> => {
    let filePaths
    const res = await dialog.showOpenDialog(
        BrowserWindow ? BrowserWindow.getFocusedWindow() : undefined,
        // @ts-ignore
        dialogOptions
    )
    if (res.canceled || !res.filePaths || !res.filePaths.length) {
        filePaths = []
    }
    if (res.filePaths) {
        filePaths = asFileURL
            ? res.filePaths.map((fp) => pathToFileURL(fp).href)
            : res.filePaths
    } else {
        filePaths = []
    }
    return filePaths
}

// const showSaveDialog = async (
//     callback: (filepath: string) => void,
//     dialogOptions: Electron.SaveDialogOptions,
//     asFileURL: boolean = true
// ): Promise<void> => {
//     let filePath
//     // @ts-ignore
//     const res = await dialog.showSaveDialog(
//         BrowserWindow ? BrowserWindow.getFocusedWindow() : undefined,
//         dialogOptions
//     )
//     if (res.canceled || !res.filePath) {
//         filePath = undefined
//     }
//     if (res.filePath) {
//         filePath = asFileURL ? pathToFileURL(res.filePath).href : res.filePath
//     } else {
//         filePath = undefined
//     }
//     if (callback && filePath) {
//         callback(filePath)
//     }
// }

function setupFileDialogEvents() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.on(IPC_EVENT_showOpenFileDialog, async (event, payload) => {
        let filePaths = await showOpenFileDialog(
            payload.dialogOptions,
            payload.asFileURL
        )
        event.sender.send(IPC_EVENT_showOpenFileDialog, filePaths)
    })
    // ipcMain.on(IPC_EVENT_showSaveDialog, async (event, payload) => {
    //     await showSaveDialog((filePath) => {
    //         event.sender.send(IPC_EVENT_showSaveDialog, filePath)
    //     }, payload.getFileURL)
    // })
}
export { setupFileDialogEvents, showOpenFileDialog }
