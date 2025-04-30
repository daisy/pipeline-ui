import { ipcRenderer } from 'electron'
import * as events from 'shared/main-renderer-events'

// options: { title, buttonLabel, properties, filters }
export function showOpenFileDialog(options: {
    dialogOptions: Electron.OpenDialogOptions
}) {
    return ipcRenderer.invoke(events.IPC_EVENT_showOpenFileDialog, options)
}
