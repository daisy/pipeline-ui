// import { Tab } from 'shared/types'
// import { IPC } from 'shared/constants'
// import { selectTab, addTab, removeTab } from 'shared/data/slices/tabs'
// import { BrowserWindow, ipcMain } from 'electron'
// import { ApplicationSettings } from 'shared/types'

// import { store } from 'main/data/store'

// export function registerTabsIPC() {
//     // get state from the instance
//     ipcMain.handle(IPC.TABS.SELECT, (event) => {
//         return selectTab(store.getState())
//     })

//     ipcMain.on(IPC.TABS.SELECT, (event, newTab) => {
//         store.dispatch(selectTab(newTab))
//         BrowserWindow.getAllWindows().forEach((window) => {
//             window.webContents.send(
//                 IPC.TABS.SELECT,
//                 selectTab(store.getState())
//             )
//         })
//     })

//     return selectTab(store.getState())
// }
export const x = 5
