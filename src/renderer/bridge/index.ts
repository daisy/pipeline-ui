import { contextBridge, ipcRenderer } from 'electron'
import * as ipcs from './ipcs'

import { actions, SliceActions } from 'shared/data/slices'
import { IPC } from 'shared/constants'
import { Slice } from '@reduxjs/toolkit'
import { RootState } from 'shared/types/store'
import { settings } from 'shared/data/slices/settings'

export type SliceIPCs<T> = {
    [K in keyof T]: () => void
}

export type SliceIPCsMap = Map<string, () => void>
export type SliceActionsMap = Map<string, SliceIPCs<unknown>>

declare global {
    interface Window {
        App: typeof API
    }
}

/**
 * Proxy object to handle store state
 */
let proxyStore = ipcRenderer.sendSync(IPC.STORE.GET) as RootState
console.log('bridge launch', proxyStore)

/**
 * Redux actions management for the proxy
 */
const sliceActions = new Map<string, SliceIPCs<unknown>>(
    actions.map((sa: SliceActions) => {
        // Create event listener for slice updates
        const sliceUpdater = (newSliceState) =>
            (proxyStore[sa.slice] = newSliceState)
        return [
            sa.slice,
            Object.entries(sa.actions).reduce(
                (acc: SliceIPCs<unknown>, [name, type]: [string, string]) => {
                    // Make ipc action
                    acc[name] = (...payload) => ipcRenderer.send(type, payload)
                    // Create ipc listener on slice state update forwarding for an action
                    ipcRenderer.on(type, (even, newState) => {
                        console.log(type, newState)
                        sliceUpdater(newState)
                    })
                    return acc
                },
                {}
            ),
        ]
    })
) as SliceActionsMap

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
        slice: (s: Slice): SliceIPCsMap => sliceActions[s.name],
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
