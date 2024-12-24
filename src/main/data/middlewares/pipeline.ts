import {
    useWebservice,
    setScripts,
    setDatatypes,
    removeJob,
    runJob,
    start,
    stop,
    updateScript,
    updateDatatype,
    removeJobs,
    setProperties,
    requestStylesheetParameters,
} from 'shared/data/slices/pipeline'

import { Datatype, Job, Script } from 'shared/types'

import { error } from 'electron-log'

import { pipelineAPI } from '../apis/pipeline'
import { PayloadAction } from '@reduxjs/toolkit'

import { getPipelineInstance } from '../instance'
import * as actions from './actions'

/**
 * Middleware to fetch data from the pipeline
 * and manage a local pipeline instance
 * @param param0
 * @returns
 */
export function pipelineMiddleware({ getState, dispatch }) {
    return (next) => (action: PayloadAction<any>) => {
        switch (action.type) {
            case start.type:
                getPipelineInstance(getState())?.launch()
                break
            case stop.type:
                getPipelineInstance(getState())?.stop(action.payload)
                break
            case useWebservice.type:
                actions.useWebservice(action, dispatch, getState)
                break
            case setScripts.type:
                for (const script of action.payload as Array<Script>) {
                    pipelineAPI
                        .fetchScriptDetails(script)()
                        .then((updated) => {
                            dispatch(updateScript(updated))
                        })
                        .catch((e) =>
                            error('error fetching script details', script, e)
                        )
                }
                break
            case setDatatypes.type:
                for (const datatype of action.payload as Array<Datatype>) {
                    pipelineAPI
                        .fetchDatatypeDetails(datatype)()
                        .then((updated) => {
                            dispatch(updateDatatype(updated))
                        })
                        .catch((e) =>
                            error(
                                'error fetching datatype details',
                                datatype,
                                e
                            )
                        )
                }
                break
            case removeJobs.type: // Batch removal of jobs in engine (no state check on removal)
                actions.removeJobs(action)
                break
            case removeJob.type:
                actions.removeJob(action, dispatch, getState)
                break
            case setProperties.type: // Update properties in the engine
                actions.setProperties(action, dispatch, getState)
                break
            case runJob.type:
                actions.runJob(action.payload as Job, dispatch, getState)
                break
                break
            case requestStylesheetParameters.type:
                actions.requestStylesheetParameters(action, dispatch, getState)
                break
            default:
                if (action.type.startsWith('settings/')) {
                    // FIXME : check if local pipeline props have changed and
                    // if so, recreate a new pipeline instance from it using stop and start
                }
                break
        }
        if (action != null) return next(action)
    }
}
