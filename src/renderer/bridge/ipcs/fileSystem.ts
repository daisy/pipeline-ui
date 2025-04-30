import { ipcRenderer, webUtils } from 'electron'
import * as events from 'shared/main-renderer-events'

export function pathExists(path) {
    return ipcRenderer.invoke(events.IPC_EVENT_pathExists, path)
}

export function sniffEncoding(filepath) {
    return ipcRenderer.invoke(events.IPC_EVENT_sniffEncoding, filepath)
}
// get the path of a file that was dropped
export const getDroppedFilePath = (file) => webUtils.getPathForFile(file)

export function detectFiletype(filepath) {
    return ipcRenderer.invoke(events.IPC_EVENT_detectFiletype, filepath)
}

export function traverseDirectory(dirpath) {
    return ipcRenderer.invoke(events.IPC_EVENT_traverseDirectory, dirpath)
}

export function isFile(itemPath) {
    return ipcRenderer.invoke(events.IPC_EVENT_isFile, itemPath)
}

export function isDirectory(itemPath) {
    return ipcRenderer.invoke(events.IPC_EVENT_isDirectory, itemPath)
}

export function fileURLToPath(fileurl) {
    return ipcRenderer.invoke(events.IPC_EVENT_fileURLToPath, fileurl)
}

export function pathToFileURL(filepath) {
    return ipcRenderer.invoke(events.IPC_EVENT_pathToFileURL, filepath)
}
