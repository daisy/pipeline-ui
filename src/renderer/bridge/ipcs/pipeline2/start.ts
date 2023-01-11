import { ipcRenderer } from 'electron'
import { Pipeline2IPCProps } from 'main/factories'

import { IPC } from 'shared/constants'
import { PipelineState, Webservice } from 'shared/types'

export function launchPipeline(webserviceProps?: Webservice) {
    const channel = IPC.PIPELINE.START
    ipcRenderer.send(IPC.PIPELINE.START, webserviceProps)
}
