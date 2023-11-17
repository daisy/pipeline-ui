// pass through log statements from the renderer process to the main process
// electron-log is supposed to work from within the renderer process but it's not currently
// https://github.com/megahertz/electron-log/issues/363
// so this is a workaround

import { ipcMain } from 'electron'
import { IPC_EVENT_log } from '../shared/main-renderer-events'
import { info } from 'electron-log'

function setupLogEvents() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.on(IPC_EVENT_log, async (event, payload) => {
        info(payload)
    })
}
export { setupLogEvents }
