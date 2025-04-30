import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// options: { title, buttonLabel, properties, filters }
export async function showMessageBoxYesNo(msg) {
    return ipcRenderer.invoke(events.IPC_EVENT_messageBoxYesNo, msg)
}
