import { configureStore } from '@reduxjs/toolkit'
import { ipcMain } from 'electron'
//import { PipelineStatus } from 'shared/types'

import { slices } from 'shared/data/slices'

import { RootState } from 'shared/types/store'
import { readSettings, middlewares } from './middlewares'
import { IPC } from 'shared/constants'

let preloadedState: RootState = {
    // pipeline: {
    //     status: PipelineStatus.UNKNOWN,
    //     scripts: [],
    //     jobs: [],
    // },
    settings: readSettings(),
}

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

/**
 * Redux store of the application
 */
export const store = configureStore({
    preloadedState,
    reducer: slices.reduce((acc, slice) => {
        acc[slice.name] = slice.reducer
        return acc
    }, {}),
    devTools: process.env.NODE_ENV !== 'production',
    // Note : apply the middleware to update the store file
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(...middlewares),
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
                console.log(action.type, payload)
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
