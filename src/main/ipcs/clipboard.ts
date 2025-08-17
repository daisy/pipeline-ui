import { ipcMain, clipboard } from 'electron'

// helper functions
const { IPC_EVENT_copyToClipboard } = require('../../shared/main-renderer-events')

const copyToClipboard = (str) => {
    clipboard.writeText(str)
}

function setupClipboardEvents() {
    ipcMain.on(IPC_EVENT_copyToClipboard, (event, payload) => {
        copyToClipboard(payload)
    })
}
export { setupClipboardEvents }
