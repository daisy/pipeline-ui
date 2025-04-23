// various file system utility functions
import { ipcMain } from 'electron'
import fs from 'fs-extra'
import chardet from 'chardet'
import {
    IPC_EVENT_detectFiletype,
    IPC_EVENT_pathExists,
    IPC_EVENT_sniffEncoding,
    IPC_EVENT_traverseDirectory,
    IPC_EVENT_isFile,
    IPC_EVENT_getFileUrl,
} from '../../shared/main-renderer-events'
import { PLATFORM, scriptInputFiletypes } from 'shared/constants'
import { sniffFile } from './sniffFile'
import { Filetype } from 'shared/types'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

function pathExists(path) {
    if (path.length == 0) return false

    let path_ = decodeURI(path)
    if (path_.startsWith('file:')) {
        path_ = fileURLToPath(path_)
    }
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
    if (filepath.startsWith('file:')) {
        filepath = fileURLToPath(filepath)
    }
    let encoding = await chardet.detectFile(filepath)
    return encoding.toString()
}

async function detectFiletype(filepath: string): Promise<Filetype> {
    if (filepath.startsWith('file:')) {
        filepath = fileURLToPath(filepath)
    }
    let filetypeType = await sniffFile(filepath)
    console.log('file sniffed as ', filetypeType)
    // some special types exist where the result of sniffFile is also the filetype type
    let specialType = scriptInputFiletypes.find((ft) => ft.type == filetypeType)
    if (specialType) {
        console.log("matches special type", specialType)
        return specialType
    }

    // or the filetype could be given by the extension
    if (filetypeType == 'xhtml') {
        return scriptInputFiletypes.find(
            (mt) => mt.type == 'application/xhtml+xml'
        )
    } else if (filetypeType == 'html') {
        return scriptInputFiletypes.find((mt) => mt.type == 'text/html')
    } else if (filetypeType == 'dtbook') {
        return scriptInputFiletypes.find(
            (mt) => mt.type == 'application/x-dtbook+xml'
        )
    } else if (filetypeType == 'zedai') {
        return scriptInputFiletypes.find(
            (mt) => mt.type == 'application/z3998-auth+xml'
        )
    } else if (filetypeType == 'xml') {
        return scriptInputFiletypes.find((mt) => mt.type == 'application/xml')
    } else {
        let mt = scriptInputFiletypes.find((mt) =>
            mt.extensions.includes(filetypeType)
        )
        return mt ?? null
    }
}

export interface FileTreeEntry {
    name: string
    type: 'directory' | 'file'
    path: string
    contents: Array<FileTreeEntry>
}

async function traverseDirectory(dirPath): Promise<Array<FileTreeEntry>> {
    try {
        if (dirPath.startsWith('file:')) {
            dirPath = fileURLToPath(dirPath)
        }
        let entries = await fs.readdir(dirPath, { withFileTypes: true })
        let fileTree = []
        for (let entry of entries) {
            let fullPath = path.join(dirPath, entry.name)

            if (entry.isDirectory()) {
                // Recursively traverse subdirectories
                let subDirContents = await traverseDirectory(fullPath)
                fileTree.push({
                    name: entry.name,
                    type: 'directory',
                    path: fullPath,
                    contents: subDirContents,
                })
            } else {
                // Get file stats
                fileTree.push({
                    name: entry.name,
                    type: 'file',
                    path: pathToFileURL(fullPath).href,
                })
            }
        }
        return fileTree
    } catch (error) {
        console.error(`Error traversing directory ${dirPath}:`, error)
        return []
    }
}
function isFile(itemPath: string) {
    if (itemPath.startsWith('file:')) {
        itemPath = fileURLToPath(itemPath)
    }
    if (fs.existsSync(itemPath)) {
        let stats = fs.statSync(itemPath)
        return stats.isFile()
    }
    return false
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
    ipcMain.on(IPC_EVENT_detectFiletype, async (event, payload) => {
        let res = await detectFiletype(payload)
        event.sender.send(IPC_EVENT_detectFiletype, res)
    })
    ipcMain.on(IPC_EVENT_traverseDirectory, async (event, payload) => {
        let res = await traverseDirectory(payload)
        event.sender.send(IPC_EVENT_traverseDirectory, res)
    })
    ipcMain.on(IPC_EVENT_isFile, async (event, payload) => {
        let res = isFile(payload)
        event.sender.send(IPC_EVENT_isFile, res)
    })
    ipcMain.on(IPC_EVENT_getFileUrl, async (event, payload) => {
        try {
            let res = pathToFileURL(payload).href
            event.sender.send(IPC_EVENT_getFileUrl, res)
        } catch (e) {
            console.error('Error converting path to file URL:', e)
            event.sender.send(IPC_EVENT_getFileUrl, null)
        }
    })
}
export { setupFileSystemEvents, pathExists, sniffEncoding }
