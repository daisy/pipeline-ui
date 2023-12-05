// various file system utility functions
import { ipcMain } from 'electron'
import fs from 'fs-extra'
import chardet from 'chardet'
import {
    IPC_EVENT_pathExists,
    IPC_EVENT_sniffEncoding,
} from '../shared/main-renderer-events'
import { PLATFORM } from 'shared/constants'

function pathExists(path) {
    if (path.length == 0) return false

    let path_ = decodeURI(path).replace('file://', '')
    // make sure the path is formatted like a path
    if (PLATFORM.IS_WINDOWS) {
        if (path_[0] == '/') {
            path_ = path_.slice(1)
            path_ = path_.replaceAll('/', '\\')
        }
    }

    return new Promise((resolve, reject) => {
        fs.access(path_, (err) => {
            if (err) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

const sniffEncoding = async (filepath: string): Promise<string> => {
    let filepath_ = filepath
    filepath_ = decodeURI(filepath_.replace('file:', '').replace('///', '/'))
    let encoding = await chardet.detectFile(filepath_)
    return encoding.toString()
}

function setupFileSystemEvents() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.on(IPC_EVENT_pathExists, async (event, payload) => {
        let res = await pathExists(payload)
        event.sender.send(IPC_EVENT_pathExists, res)
    })
    ipcMain.on(IPC_EVENT_sniffEncoding, async (event, payload) => {
        let res = await sniffEncoding(payload)
        event.sender.send(IPC_EVENT_sniffEncoding, res)
    })
}
export { setupFileSystemEvents, pathExists, sniffEncoding }
