import { app, BrowserWindow, Event, ipcMain, nativeTheme } from 'electron'
import { store } from 'main/data/store'

import { ENVIRONMENT, IPC, PLATFORM } from 'shared/constants'
import { selectPipeline } from 'shared/data/slices/pipeline'
import { selectSettings } from 'shared/data/slices/settings'
import { WindowProps } from 'shared/types'
import { APP_CONFIG } from '~/app.config'

import { PipelineInstance } from '../../pipeline/pipeline'

/**
 * Bind a window to a pipeline instance.
 * This binding require that the pipeline is already registered in IPC.
 * @param binding the window to bind the pipeline with
 * @param pipeline the pipeline instance to use
 * @param onCloseEventCallback the windows closing callback (if the on close event is not cumulated, might be useless)
 */
export function bindWindowToPipeline(
    binding: BrowserWindow,
    pipeline: PipelineInstance
) {
    // Keep the window id here as it is removed before the close event
    const windowID = binding.id

    pipeline.registerMessagesListener(`${windowID}`, (message) => {
        binding.webContents.send(IPC.PIPELINE.MESSAGES.UPDATE, message)
    })

    pipeline.registerErrorsListener(`${windowID}`, (message) => {
        binding.webContents.send(IPC.PIPELINE.ERRORS.UPDATE, message)
    })

    binding.on('close', (event) => {
        pipeline.removeMessageListener(`${windowID}`)
        pipeline.removeErrorsListener(`${windowID}`)
    })
}

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
