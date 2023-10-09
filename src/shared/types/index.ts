import {
    BrowserWindowConstructorOptions,
    IpcMainInvokeEvent,
    BrowserWindow,
} from 'electron'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

export interface WindowProps extends BrowserWindowConstructorOptions {
    id: string
}

export interface WindowCreationByIPC {
    channel: string
    window(): BrowserWindowOrNull
    callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

export * from './pipeline'
export * from './settings'
export * from './ttsConfig'
export * from './update'
