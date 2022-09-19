import { ipcRenderer } from 'electron'

import { IPC } from 'shared/constants'
import { PipelineState } from 'shared/types'

export function onPipelineStateChanged(callback) {
  const channel = IPC.PIPELINE.STATE.CHANGED

  return ipcRenderer.on(channel, callback)
}

export function getPipelineState(): Promise<PipelineState | null> {
  const channel = IPC.PIPELINE.STATE.GET

  return ipcRenderer.invoke(channel)
}
