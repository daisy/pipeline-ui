import { app, BrowserWindow } from 'electron'

import { ENVIRONMENT, IPC, PLATFORM } from 'shared/constants'
import { WindowProps } from 'shared/types'
import { APP_CONFIG } from '~/app.config'

export function createWindow({ id, ...settings }: WindowProps) {
    const window = new BrowserWindow(settings)
    const devServerURL = `${APP_CONFIG.RENDERER.DEV_SERVER.URL}#/${id}`

    ENVIRONMENT.IS_DEV
        ? window.loadURL(devServerURL)
        : window.loadFile('index.html', {
              hash: `/${id}`,
          })

    window.on('closed', window.destroy)

    // bypass CORS
    window.webContents.session.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            callback({
                requestHeaders: { Origin: '*', ...details.requestHeaders },
            })
        }
    )

    window.webContents.session.webRequest.onHeadersReceived(
        (details, callback) => {
            callback({
                responseHeaders: {
                    'Access-Control-Allow-Origin': ['*'],
                    ...details.responseHeaders,
                },
            })
        }
    )

    if (PLATFORM.IS_MAC) {
        app.dock.show()
    }
    return window
}
