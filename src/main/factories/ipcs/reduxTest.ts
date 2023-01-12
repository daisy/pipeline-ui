import { ipcMain } from 'electron'
import * as events from 'shared/main-renderer-events'
import { store } from 'main/data/store'
import { counter } from 'shared/data/slices/counter'
const { increment, decrement } = counter.actions

export function registerReduxTestIPC() {
    ipcMain.on(events.IPC_EVENT_decrement, (event) => {
        store.dispatch(decrement())
    })

    ipcMain.on(events.IPC_EVENT_increment, (event) => {
        store.dispatch(increment())
    })
}
