import { contextBridge, ipcRenderer } from 'electron'
import * as ipcs from './ipcs'

import { slices } from 'shared/data/slices'
import { IPC } from 'shared/constants'
import { AnyAction } from '@reduxjs/toolkit'
import { RootState } from 'shared/types/store'
import 'electron-log/preload'

declare global {
    interface Window {
        App: typeof API
    }
}

/**
 * Proxy object to handle store state
 */
let proxyStore = ipcRenderer.sendSync(IPC.STORE.GET) as RootState

slices.forEach((slice) => {
    const sliceUpdater = (newSliceState) =>
        (proxyStore[slice.name] = newSliceState)
    Object.entries(slice.actions).forEach(([name, { type }]) => {
        ipcRenderer.on(type, (even, newState) => {
            sliceUpdater(newState)
        })
    })
})

function dispatch<ReturnType, Action extends AnyAction>(action: Action) {
    ipcRenderer.send(action.type, action.payload)
}

const API = {
    ...ipcs,
    sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
    username: process.env.USER,
    showOpenFileDialog: ipcs.showOpenFileDialog,
    // showSaveDialog: ipcs.showSaveDialog,
    showItemInFolder: ipcs.showItemInFolder,
    openInBrowser: ipcs.openInBrowser,
    pathExists: ipcs.pathExists,
    whenAboutWindowClosed: ipcs.whenAboutWindowClose,
    sniffEncoding: ipcs.sniffEncoding,
    copyToClipboard: ipcs.copyToClipboard,
    oneTimeFetch: ipcs.oneTimeFetch,
    onScriptFormSubmit: (channel, listener) => ipcRenderer.on(channel, listener),
    // we can add on to this API and restructure it as we move more commands to the redux side
    store: {
        dispatch,
        getStateSync: () => ipcRenderer.sendSync(IPC.STORE.GET),
        getState: () => proxyStore,
        // Listener on store changes after a specific action
        onSliceUpdate: (actionType, callback) =>
            ipcRenderer.on(actionType, (event, data) => callback(data)),
    },
    getDroppedFilePath: (fileurl) => ipcs.getDroppedFilePath(fileurl),
    detectFiletype: (filepath) => ipcs.detectFiletype(filepath),
    traverseDirectory: (dirpath) => ipcs.traverseDirectory(dirpath),
    isFile: (itempath) => ipcs.isFile(itempath),
    showMessageBoxYesNo: async (msg) => ipcs.showMessageBoxYesNo(msg),
    pathToFileURL: (filepath) => ipcs.pathToFileURL(filepath),
    fileURLToPath: (fileurl) => ipcs.fileURLToPath(fileurl),
}

contextBridge.exposeInMainWorld('App', API)
