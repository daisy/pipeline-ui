import { app, BrowserWindow } from 'electron'
import { error, warn } from 'electron-log'
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
    window.on('unresponsive', () => warn(`window:${id}:unresponsive`))
    window.webContents.on(
        'did-fail-load',
        (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            error(`window:${id}:did-fail-load`, {
                errorCode,
                errorDescription,
                validatedURL,
                isMainFrame,
            })
        }
    )
    window.webContents.on('preload-error', (_event, preloadPath, err) => {
        error(`window:${id}:preload-error`, { preloadPath, err })
    })
    window.webContents.on(
        'console-message',
        (_event, level, message, line, sourceId) => {
            if (
                level < 2 ||
                sourceId?.includes('/electron-log') ||
                message.includes(`window:${id}:console-message`)
            ) {
                return
            }

            const payload = { level, message, line, sourceId }
            if (level >= 3) {
                error(`window:${id}:console-message`, payload)
            } else {
                warn(`window:${id}:console-message`, payload)
            }
        }
    )

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
