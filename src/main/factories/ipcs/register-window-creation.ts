import { ipcMain } from 'electron'

import { WindowCreationByIPC, BrowserWindowOrNull } from 'shared/types'

export function registerWindowCreationByIPC({
    channel,
    callback,
    window: createWindow,
}: WindowCreationByIPC) {
    let window: BrowserWindowOrNull
    ipcMain.on(channel, (event) => {
        if (!createWindow) return
        if (window) {
            // the window is already open, bring it to the front
            window.show()
        } else {
            window = createWindow()
            window.on('closed', () => (window = null))
            callback && callback(window, event)
        }
    })
}
