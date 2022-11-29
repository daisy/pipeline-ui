import { ipcMain } from 'electron'
import { IPC } from 'shared/constants'
import { writeFile } from 'fs/promises'
import { info } from 'electron-log'
import { dirname } from 'path'

export function registerFileIPC() {
    ipcMain.handle(IPC.FILE.SAVE, async (event, buffer: Buffer, path) => {
        return writeFile(path, buffer)
            .catch((e) => {
                info('An error occured writing file ', path, ' : ', e)
                return false
            })
            .then((v) => {
                return true
            })
    })

    ipcMain.handle(IPC.FILE.UNZIP, (event, buffer, path) => {
        // Save and unzip file in on a
        // return an url tree of the files
        return writeFile(path, buffer)
            .catch((e) => {
                info('An error occured writing file ', path, ' : ', e)
                return null
            })
            .then((v) => {
                // unzip file in the path
                const dest = dirname(path)
                // TODO : unzip files
                return true
            })
    })

    ipcMain.on(IPC.FILE.OPEN, (event, path) => {
        // Request the opening of a file in the system
    })
}
