import { ipcRenderer, webUtils } from 'electron'
import { FileTreeEntry } from 'main/ipcs/fileSystem'
import * as events from 'shared/main-renderer-events'
import { Filetype } from 'shared/types'

export function pathExists(path) {
    return new Promise<boolean>((resolve, reject) => {
        ipcRenderer.send(events.IPC_EVENT_pathExists, path)
        ipcRenderer.once(events.IPC_EVENT_pathExists, (event, res: boolean) => {
            resolve(res)
        })
    })
}

export function sniffEncoding(filepath) {
    return new Promise<string>((resolve, reject) => {
        ipcRenderer.send(events.IPC_EVENT_sniffEncoding, filepath)
        ipcRenderer.once(
            events.IPC_EVENT_sniffEncoding,
            (event, res: string) => {
                resolve(res)
            }
        )
    })
}

export function getFilePath(file) {
    const path = webUtils.getPathForFile(file)
    return path
}

export function detectFiletype(filepath) {
    return new Promise<Filetype>((resolve, reject) => {
        ipcRenderer.send(events.IPC_EVENT_detectFiletype, filepath)
        ipcRenderer.once(
            events.IPC_EVENT_detectFiletype,
            (event, res: Filetype) => {
                resolve(res)
            }
        )
    })
}

export function traverseDirectory(dirpath) {
    return new Promise<Array<FileTreeEntry>>((resolve, reject) => {
        ipcRenderer.send(events.IPC_EVENT_traverseDirectory, dirpath)
        ipcRenderer.once(
            events.IPC_EVENT_traverseDirectory,
            (event, res: Array<FileTreeEntry>) => {
                resolve(res)
            }
        )
    })
}

export function isFile(itemPath) {
    return new Promise<boolean>((resolve, reject) => {
        ipcRenderer.send(events.IPC_EVENT_isFile, itemPath)
        ipcRenderer.once(events.IPC_EVENT_isFile, (event, res: boolean) => {
            console.log("file system bridge says", itemPath, res)
            resolve(res)
        })
    })
}
