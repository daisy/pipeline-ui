import { ipcMain, dialog, BrowserWindow, shell, clipboard } from 'electron'
import { PLATFORM, ENVIRONMENT } from 'shared/constants'

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
