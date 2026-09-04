import { app } from 'electron'
import { error, info, warn } from 'electron-log'

export function registerProcessDiagnostics() {
    process.on('uncaughtException', (err) => {
        error('main process uncaughtException', err)
    })
    process.on('unhandledRejection', (reason) => {
        error('main process unhandledRejection', reason)
    })
    process.on('warning', (warning) => {
        warn('main process warning', warning)
    })
    app.on('render-process-gone', (_event, webContents, details) => {
        error('render process gone', {
            reason: details.reason,
            exitCode: details.exitCode,
            url: webContents.getURL(),
        })
    })
    app.on('child-process-gone', (_event, details) => {
        error('child process gone', details)
    })
    app.on('before-quit', () => {
        info('app before-quit')
    })
    app.on('will-quit', () => {
        info('app will-quit')
    })
}
