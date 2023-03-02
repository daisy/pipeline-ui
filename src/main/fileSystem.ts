// various file system utility functions
import { ipcMain } from 'electron'
import fs from 'fs-extra'
import chardet from 'chardet'
import {
    IPC_EVENT_pathExists,
    IPC_EVENT_sniffEncoding,
} from '../shared/main-renderer-events'

async function pathExists(path) {
    await fs.access(path, (err) => {
        if (err) {
            return false
        } else {
            return true
        }
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
        console.log("encoding sniff requested", payload)
        let res = await sniffEncoding(payload)
        console.log("encoding is ", res)
        event.sender.send(IPC_EVENT_sniffEncoding, res)
    })
}
export { setupFileSystemEvents, pathExists, sniffEncoding }
