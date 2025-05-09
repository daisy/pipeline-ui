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
    IPC_EVENT_isDirectory,
    IPC_EVENT_fileURLToPath,
    IPC_EVENT_pathToFileURL,
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
    let encoding = await chardet.detectFile(filepath)
    return encoding.toString()
}

async function detectFiletype(filepath: string): Promise<Filetype> {
    let filetypeType = await sniffFile(filepath)
    // some special types exist where the result of sniffFile is also the filetype type
    let specialType = scriptInputFiletypes.find((ft) => ft.type == filetypeType)
    if (specialType) {
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
                    path: fullPath,
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
    let filepath = itemPath
    if (itemPath.startsWith('file:')) {
        filepath = fileURLToPath(itemPath)
    }
    if (fs.existsSync(filepath)) {
        let stats = fs.statSync(filepath)
        return stats.isFile()
    }
    return false
}
function isDirectory(itemPath: string) {
    let filepath = itemPath
    if (itemPath.startsWith('file:')) {
        filepath = fileURLToPath(itemPath)
    }
    if (fs.existsSync(filepath)) {
        let stats = fs.statSync(filepath)
        return stats.isDirectory()
    }
    return false
}
function isURL(str: string) {
    try {
        // see if it can be a URL object
        new URL(str)
    } catch (_) {
        return false
    }
    // however, this can return a false positive on windows, so check other things too
    if (str.toLowerCase().startsWith('file://')) {
        return true
    }
    return false
}
function setupFileSystemEvents() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.handle(IPC_EVENT_pathExists, async (event, payload) => {
        let res = await pathExists(payload)
        return res
    })
    ipcMain.handle(IPC_EVENT_sniffEncoding, async (event, payload) => {
        let res = await sniffEncoding(payload)
        return res
    })
    ipcMain.handle(IPC_EVENT_detectFiletype, async (event, payload) => {
        let res = await detectFiletype(payload)
        return res
    })
    ipcMain.handle(IPC_EVENT_traverseDirectory, async (event, payload) => {
        let res = await traverseDirectory(payload)
        return res
    })
    ipcMain.handle(IPC_EVENT_isFile, (event, payload) => {
        let res = isFile(payload)
        return res
    })
    ipcMain.handle(IPC_EVENT_isDirectory, (event, payload) => {
        let res = isDirectory(payload)
        return res
    })
    ipcMain.handle(IPC_EVENT_pathToFileURL, (event, payload) => {
        try {
            if (isURL(payload)) {
                return payload
            }
            let res = pathToFileURL(payload).href
            return res
        } catch (e) {
            console.error('Error converting path to file URL:', e)
            return null
        }
    })
    ipcMain.handle(IPC_EVENT_fileURLToPath, (event, payload) => {
        try {
            if (!isURL(payload)) {
                return payload
            }
            let res = fileURLToPath(payload)
            return res
        } catch (e) {
            console.error('Error converting file URL to path:', e)
            return null
        }
    })
}
export { setupFileSystemEvents, pathExists, sniffEncoding }
