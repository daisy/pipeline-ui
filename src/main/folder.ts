import { ipcMain, shell } from 'electron'
import { PLATFORM } from 'shared/constants'

// helper functions
import { IPC_EVENT_showItemInFolder } from '../shared/main-renderer-events'

function setupShowInFolderEvents() {
    ipcMain.on(IPC_EVENT_showItemInFolder, (event, payload) => {
        let f = payload
        if (PLATFORM.IS_WINDOWS) {
            if (f[0] == '/') {
                f = f.slice(1)
                f = f.replaceAll('/', '\\')
            }
        }
        shell.showItemInFolder(f)
    })
}
export { setupShowInFolderEvents }
