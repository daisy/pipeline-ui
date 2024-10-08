// fetch a resource and return the result to the renderer
// this is meant as a one-off utility for special cases
import { ipcMain } from 'electron'
import { IPC_EVENT_oneTimeFetch } from '../shared/main-renderer-events'
import fetch from 'node-fetch'

async function oneTimeFetch(url) {
    if (url.length == 0) return false

    let res = await fetch(url)
    if (res) {
        return res.json()
    }
    else {
        return null
    }
}

function setupOneTimeFetchEvent() {
    // comes from the renderer process (ipcRenderer.send())
    ipcMain.on(IPC_EVENT_oneTimeFetch, async (event, payload) => {
        let res = await oneTimeFetch(payload)
        event.sender.send(IPC_EVENT_oneTimeFetch, res)
    })
}
export { setupOneTimeFetchEvent, oneTimeFetch }
