import { ipcMain, shell } from 'electron'

// helper functions
import { IPC_EVENT_openInBrowser } from '../../shared/main-renderer-events'

function setupOpenInBrowserEvents() {
    // payload should be "/Path/to/folder" not file://..
    ipcMain.on(IPC_EVENT_openInBrowser, (event, payload) => {
        try {
            shell.openExternal(payload)
        } catch (err) {
            console.log('Error opening external link', err)
        }
    })
}
export { setupOpenInBrowserEvents }
