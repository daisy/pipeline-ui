import { app, BrowserWindow } from 'electron'
import { join } from 'path'

import { ENVIRONMENT, IPC, PLATFORM } from 'shared/constants'
import { WindowProps } from 'shared/types'

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

export function createWindow(
    { id, ...settings }: WindowProps,
    hash: string = ''
) {
    const window = new BrowserWindow(settings)

    const devServerURL = `${process.env['ELECTRON_RENDERER_URL']}#/${id}${hash}`

    ENVIRONMENT.IS_DEV
        ? window.loadURL(devServerURL)
        : window.loadFile(join(__dirname, '../renderer/index.html'), {
              hash: `/${id}${hash}`,
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
