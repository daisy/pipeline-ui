import { contextBridge, ipcRenderer } from 'electron'
import * as ipcs from './ipcs'

import { actionsTree } from 'shared/data/slices'
import { IPC } from 'shared/constants'
import { Slice } from '@reduxjs/toolkit'
import { RootState } from 'shared/types/store'

declare global {
    interface Window {
        App: typeof API
    }
}

/**
 * Redux actions tree
 */
const reduxActions = Object.entries(actionsTree).reduce(
    (ipcs, [slice, actions]: [string, any]) => {
        ipcs[slice] = Object.entries(actions).reduce(
            (sliceIPCs, [name, type]: [string, string]) => {
                sliceIPCs[name] = (...payload) =>
                    ipcRenderer.send(type, payload)
                return sliceIPCs
            },
            {}
        )
        return ipcs
    },
    {}
)

let proxyStore = {} as RootState
// Do a deep diff update here
ipcRenderer.on(IPC.STORE.UPDATED, (event, newState) => {
    proxyStore = newState
    console.log(proxyStore)
})

const API = {
    ...ipcs,
    sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
    username: process.env.USER,
    showOpenFileDialog: ipcs.showOpenFileDialog,
    showSaveDialog: ipcs.showSaveDialog,
    showItemInFolder: ipcs.showItemInFolder,
    openInBrowser: ipcs.openInBrowser,
    pathExists: ipcs.pathExists,
    whenAboutWindowClosed: ipcs.whenAboutWindowClose,

    // we can add on to this API and restructure it as we move more commands to the redux side
    reduxTest: {
        increment: ipcs.increment,
        decrement: ipcs.decrement,
    },
    store: {
        slice: (s: Slice) => reduxActions[s.name],
        // Synchronously get redux store state (for )
        getStateSync: () => ipcRenderer.sendSync(IPC.STORE.GET),
        getState: () =>
            proxyStore ??
            ipcRenderer.invoke(IPC.STORE.GET).then((value) => {
                proxyStore = value
                return proxyStore
            }),
        // Listener on store changes
        // The window need to subscribe to the store and send back
        // an IPC.STORE.UPDATED event with the new state on store changes
        onUpdate: (callback) =>
            ipcRenderer.on(IPC.STORE.UPDATED, (event, newState) =>
                callback(newState)
            ),
    },
}

contextBridge.exposeInMainWorld('App', API)
