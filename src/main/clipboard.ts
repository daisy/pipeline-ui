import { ipcMain, dialog, BrowserWindow, shell, clipboard } from 'electron'
import { PLATFORM, ENVIRONMENT } from 'shared/constants'

// helper functions
const { IPC_EVENT_copyToClipboard } = require('../shared/main-renderer-events')

const copyToClipboard = (str) => {
  clipboard.writeText(str)
}

function setupClipboardEvents() {
  //  event.sender is Electron.WebContents
  //  const win = BrowserWindow.fromWebContents(event.sender) || undefined;
  //  const webcontent = webContents.fromId(payload.webContentID); // webcontents.id is identical

  ipcMain.on(IPC_EVENT_copyToClipboard, (event, payload) => {
    let f = payload
    // copyToClipboard(payload)
    if (PLATFORM.IS_WINDOWS) {
      if (f[0] == '/') {
        f = f.slice(1)
        f = f.replaceAll('/', '\\')
      }
    }
    shell.showItemInFolder(f)
  })
}
export { setupClipboardEvents }
