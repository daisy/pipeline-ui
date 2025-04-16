import { configureStore, createAction, PayloadAction } from '@reduxjs/toolkit'
import { ipcMain, BrowserWindow } from 'electron'
import { PipelineStatus } from 'shared/types'
import { slices } from 'shared/data/slices'
import { RootState } from 'shared/types/store'
import { IPC } from 'shared/constants'

import { middlewares } from './middlewares'
import { readSettings } from './settings'
import { getInitialState } from 'shared/data/store'

let preloadedState: RootState = getInitialState()

preloadedState.settings = readSettings()

// Code to preload store if we want the store to be saved accross application launches
// const storeFile = resolve(app.getPath('userData'), 'store.json')
// try {
//     if (existsSync(storeFile)) {
//         preloadedState = JSON.parse(readFileSync(storeFile, 'utf8'))
//     }
// } catch (e) {
//     info('Error when trying to parse previous store file')
//     info(e)
//     info('Falling back to empty store')
// }

// Action to trigger state forwarding to frontend
const forwardAction = createAction<{ type: string }>('electron/forward')

/**
 * Electron slice state forwarding for partial updates
 * the middleware triggers a forwardAction for any other action sent to the store
 * and then forward the state of the slice that have been updated by the previous action
 * when receiving the forwardAction
 * @param param0
 * @returns
 */
function forwardToFrontend({ getState, dispatch }) {
    return (next) => (action: PayloadAction<any>) => {
        const returnValue = next(action)
        if (action.type == forwardAction.type) {
            // forward request receive
            const state = getState()
            const lastAction = action.payload
            // For a given action, send back the state update
            // for each action, a slice state update must be managed on the frontend
            BrowserWindow.getAllWindows().forEach((w) => {
                const slicePath = lastAction.type.split('/').slice(0, -1)
                const sliceState = slicePath.reduce((s, v) => s[v], state)
                w.webContents.send(lastAction.type, sliceState)
            })
        } else {
            // Request forwarding after the action is finished
            // to ensure we have the latest store state available
            dispatch(forwardAction(action))
        }
        return returnValue
    }
}

/**
 * Redux store of the application
 */
export const store = configureStore({
    preloadedState,
    reducer: {
        ...slices.reduce((acc, slice) => {
            acc[slice.name] = slice.reducer
            return acc
        }, {}),
    },
    devTools: process.env.NODE_ENV !== 'production',
    // Note : apply the middleware to update the store file
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(...middlewares, forwardToFrontend),
})

// Register every actions of the store as IPC channel
export function registerStoreIPC() {
    ipcMain.on(IPC.STORE.GET, (event) => {
        event.returnValue = store.getState()
    })
    ipcMain.handle(IPC.STORE.GET, (event) => {
        return store.getState()
    })
    for (const slice of slices) {
        for (const [key, action] of Object.entries(slice.actions)) {
            ipcMain.on(action.type, (event, payload) => {
                store.dispatch(action(payload))
            })
        }
    }
}

/**
 * possible store cleaning when application is quitting
 */
// app.on('quit', (event) => {
//     // could delete store file
// })
