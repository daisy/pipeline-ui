import { ipcRenderer } from 'electron'

import { IPC } from 'shared/constants'

export function onPipelineStateChanged(callback) {
  const channel = IPC.PIPELINE.STATE.CHANGED

  ipcRenderer.on(channel, callback)
}

export function getPipelineState() {
  const channel = IPC.PIPELINE.STATE.GET

  return ipcRenderer.invoke(channel)
}
