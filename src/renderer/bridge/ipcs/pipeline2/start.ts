import { ipcRenderer } from 'electron'

import { IPC } from 'shared/constants'

export function launchPipeline() {
  const channel = IPC.PIPELINE.START

  ipcRenderer.send(channel)
}
