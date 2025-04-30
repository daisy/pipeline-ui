import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { debug } from 'electron-log'
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
    dialogOptions: Electron.OpenDialogOptions
): Promise<void> => {
    let filePaths
    const res = await dialog.showOpenDialog(
        BrowserWindow ? BrowserWindow.getFocusedWindow() : undefined,
        // @ts-ignore
        dialogOptions
    )
    if (res.canceled || !res.filePaths || !res.filePaths.length) {
        filePaths = []
    } else {
        filePaths = res.filePaths
    }
    return filePaths
}

function setupFileDialogEvents() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.handle(IPC_EVENT_showOpenFileDialog, async (event, payload) => {
        let filePaths = await showOpenFileDialog(payload.dialogOptions)
        return filePaths
    })
}
export { setupFileDialogEvents, showOpenFileDialog }
