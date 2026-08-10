import { ipcRenderer } from 'electron'
import { IPC } from 'shared/constants'
import { Webservice } from 'shared/types'

export function testPipelineConnection(webservice: Webservice) {
    return ipcRenderer.invoke(IPC.PIPELINE.TEST_CONNECTION, webservice)
}
