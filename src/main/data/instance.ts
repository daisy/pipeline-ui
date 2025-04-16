import { PipelineInstance } from 'main/pipeline'
import { error } from 'electron-log'
import { RootState } from 'shared/types/store'
import { selectPipelineProperties } from 'shared/data/slices/settings'
import { ipcMain } from 'electron'
import { IPC } from 'shared/constants/ipc'

// Store managed pipeline instance
let _pipeline_instance: PipelineInstance = null

export function registerInstanceManagementIPCs() {
    // get properties of the instance
    ipcMain.handle(IPC.PIPELINE.PROPS, (event) => {
        return (_pipeline_instance && _pipeline_instance.props) || null
    })

    // get messages from the instance
    ipcMain.handle(IPC.PIPELINE.MESSAGES.GET, (event) => {
        return (_pipeline_instance && _pipeline_instance.messages) || null
    })
    // get errors from the instance
    ipcMain.handle(IPC.PIPELINE.ERRORS.GET, (event) => {
        return (_pipeline_instance && _pipeline_instance.errors) || null
    })
}

/**
 * Get the store managed pipeline instance
 * (to use only on the backend and after the store is initialized )
 * @param state the current store state, required to initialize the instance
 * @returns the initialized pipeline instance
 */
export const getPipelineInstance = (state: RootState): PipelineInstance => {
    try {
        if (_pipeline_instance == null) {
            _pipeline_instance = new PipelineInstance(
                selectPipelineProperties(state)
            )
        }
        return _pipeline_instance
    } catch (e) {
        error(e)
        return null
    }
}
