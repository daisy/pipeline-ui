// fetch a resource and return the result to the renderer
// this is meant as a one-off utility for special cases
import { dialog, ipcMain } from 'electron'
import { IPC_EVENT_messageBoxYesNo } from '../../shared/main-renderer-events'
import { MainWindowInstance } from 'main/windows'

function showMessageBoxYesNo(msg) {
    if (msg.length == 0) return false

    const result = dialog.showMessageBoxSync(MainWindowInstance, {
        message: msg,
        buttons: ['Yes', 'No'],
    })
    return result !== 1
}

function setupMessageBoxEvent() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.on(IPC_EVENT_messageBoxYesNo, async (event, payload) => {
        let res = showMessageBoxYesNo(payload)
        event.sender.send(IPC_EVENT_messageBoxYesNo, res)
    })
}
export { setupMessageBoxEvent, showMessageBoxYesNo }
