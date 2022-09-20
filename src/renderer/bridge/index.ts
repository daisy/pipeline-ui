import { contextBridge } from 'electron'
import * as ipcs from './ipcs'

declare global {
  interface Window {
    App: typeof API
  }
}

const API = {
  ...ipcs,
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,
  showOpenFileDialog: ipcs.showOpenFileDialog
}

contextBridge.exposeInMainWorld('App', API)
