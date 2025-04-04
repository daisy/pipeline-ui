import { pipelineAPI } from 'main/data/apis/pipeline'
import {
    Job,
    JobData,
    JobRequestError,
    JobState,
    JobStatus,
} from 'shared/types'
import {
    addJob,
    newJob,
    selectJobs,
    selectPipeline,
    selectVisibleJobs,
    selectWebservice,
    updateJob,
} from 'shared/data/slices/pipeline'
import { dialog } from 'electron'
import { MainWindowInstance } from 'main/windows'
import { removeJob as removeJobSlice } from 'shared/data/slices/pipeline'
import { error, info } from 'electron-log'
import { startMonitor } from './monitor'
import { ParserException } from 'shared/parser/pipelineXmlConverter/parser'
import { GetStateFunction } from 'shared/types/store'
import { createAction, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'
import { getBatchInputValues, getPrimaryInput } from 'shared/utils'

export function removeJobs(action: PayloadAction<any>) {
    let removedJobs = action.payload as Job[]
    for (const jobToRemove of removedJobs) {
        // Remove server-side job using API
        if (jobToRemove.jobData && jobToRemove.jobData.href) {
            const deleteJob = pipelineAPI.deleteJob(jobToRemove)
            deleteJob().then((response) => {
                console.log(
                    jobToRemove.jobData.jobId,
                    'delete response',
                    response.status,
                    response.statusText
                )
            })
        }
    }
}
export function removeBatchJob(action: PayloadAction<any>,  dispatch,
    getState: GetStateFunction) {
    // Ask delete confirmation for visible jobs deletion
    const result = dialog.showMessageBoxSync(MainWindowInstance, {
        message: `Are you sure you want to close these jobs?`,
        buttons: ['Yes', 'No'],
    })
    // Cancel action if no is selected
    action = result === 1 ? null : action
    if (action) {
        const visibleJobs = selectVisibleJobs(getState())
        removeJobs(action)
        // add a job if the batch was the last job
        if (visibleJobs.length == action.payload.length) {
            dispatch(addJob(newJob(selectPipeline(getState()))))
        }
    }
}

export function removeJob(
    action: PayloadAction<any>,
    dispatch,
    getState: GetStateFunction
) {
    let removedJob = action.payload as Job
    const currentJobs = selectJobs(getState())
    const visibleJobs = selectVisibleJobs(getState())

    if (
        removedJob.jobRequest &&
        (getState().settings.editJobOnNewTab || !removedJob.invisible)
    ) {
        // Ask delete confirmation for visible jobs deletion
        const result = dialog.showMessageBoxSync(MainWindowInstance, {
            message: `Are you sure you want to close this job?`,
            buttons: ['Yes', 'No'],
        })
        // Cancel action if no is selected
        action = result === 1 ? null : action
    }
    // #41 : Handle removing the last visible job
    if (
        action &&
        visibleJobs.length === 1 &&
        removedJob.internalId === visibleJobs[0].internalId
    ) {
        // recreate a new job tab if the job closed was not empty
        if (removedJob.jobRequest) {
            dispatch(addJob(newJob(selectPipeline(getState()))))
        } else {
            // choice 1 : avoid deleting last job present
            // action = null
            // choice 2 : Close the window
            if (MainWindowInstance != null) {
                MainWindowInstance.close()
            }
        }
    }
    // Remove linked invisible jobs
    if (action && removedJob.linkedTo && !getState().settings.editJobOnNewTab) {
        const linkedInvisibleJob = currentJobs.find(
            (j) => j.invisible && removedJob.linkedTo == j.internalId
        )
        if (linkedInvisibleJob) dispatch(removeJobSlice(linkedInvisibleJob))
    }
    if (action && removedJob.jobData && removedJob.jobData.href) {
        // Remove server-side job using API
        // if it is not already removed
        const deleteJob = pipelineAPI.deleteJob(removedJob)
        deleteJob().then((response) => {
            console.log(
                removedJob.jobData.jobId,
                'delete response',
                response.status,
                response.statusText
            )
        })
    }
}

export function runJob(jobToRun: Job, dispatch, getState: GetStateFunction) {
    // Launch the job with the API and start monitoring its execution
    // Also change its state to submited
    // const jobToRun = action.payload as Job
    const webservice = selectWebservice(getState())

    // Empty previous references to jobData results for re run
    if (jobToRun.jobData && jobToRun.jobData.results) {
        jobToRun.jobData.results = undefined
    }
    if (
        jobToRun.state === JobState.SUBMITTED ||
        jobToRun.state === JobState.SUBMITTING
    ) {
        info('Job is already launched', JSON.stringify(jobToRun))
    } else if (webservice) {
        info('Launching job', JSON.stringify(jobToRun))
        dispatch(updateJob({ ...jobToRun, state: JobState.SUBMITTING }))
        pipelineAPI
            .launchJob(jobToRun)(webservice)
            .then((jobResponse) => {
                const updatedJob = {
                    ...jobToRun,
                    state: JobState.SUBMITTED,
                } as Job
                if (
                    jobResponse.type == 'JobRequestError' ||
                    jobResponse.type == 'JobUnknownResponse'
                ) {
                    updatedJob.jobRequestError = jobResponse as JobRequestError
                } else {
                    updatedJob.jobData = jobResponse as JobData
                    // start a job monitor
                    startMonitor(updatedJob, webservice, getState, dispatch)
                }
                dispatch(updateJob(updatedJob))
            })
            .catch((e) => {
                error('error launching job', jobToRun.internalId, e)
                dispatch(
                    updateJob({
                        ...jobToRun,
                        jobData: {
                            ...jobToRun.jobData,
                            status: JobStatus.ERROR,
                        },
                        errors: [
                            {
                                error:
                                    e instanceof ParserException
                                        ? e.parsedText
                                        : String(e),
                            },
                        ],
                    })
                )
            })
    } else {
        error('No webservice available to run job', jobToRun)
        dispatch(
            updateJob({
                ...jobToRun,
                jobData: {
                    ...jobToRun.jobData,
                    status: JobStatus.ERROR,
                },
                errors: [
                    {
                        error: 'No webservice available',
                    },
                ],
            })
        )
    }
}

/**
 *
 * @param action action.payload is a Job with one JobRequest
 * input containing many values for the batch process
 *
 */
export function runBatchJobs(
    action: PayloadAction<any>,
    dispatch,
    getState: GetStateFunction
) {
    // this job is already represented internally as the default job for the tab
    let job = action.payload as Job

    // mark the job request as a batch request
    job.jobRequest.batchId = uuidv4()
    // mark this job as batch primary
    job.isPrimaryForBatch = true

    // get the batch input
    let batchInput = getPrimaryInput(job.script)
    // get the array of inputs
    let batchJobRequestInputValues = getBatchInputValues(job)

    if (batchJobRequestInputValues.length <= 1) {
        // TODO error this shouldn't happen
        return
    }

    // use one for the default job
    job.jobRequest.inputs.find((input) => input.name == batchInput.name).value =
        batchJobRequestInputValues[0]
    // run the default job
    runJob(job, dispatch, getState)

    // add the rest as extra jobs
    batchJobRequestInputValues.slice(1).map((inputValue) => {
        // would love to use structuredClone(...) but it's not working in typescript
        const { internalId, ...jobWithoutId } = { ...job }
        let newJob_ = newJob(selectPipeline(getState()))
        newJob_ = { ...newJob_, ...jobWithoutId }
        newJob_.jobRequest = { ...job.jobRequest }
        newJob_.jobRequest.options = [...job.jobRequest.options]
        // @ts-ignore
        newJob_.jobRequest.inputs = job.jobRequest.inputs.map((input) => {
            if (input.name == batchInput.name) {
                return { name: input.name, value: inputValue }
            } else {
                return input
            }
        })
        newJob_.isPrimaryForBatch = false

        // normally, the addJob action assigns an ID and adds job to state.pipeline.jobs
        // we aren't dispatching new actions from within this function so we'll do it
        // manually
        //newJob.internalId = `job-${getState().pipeline.internalJobCounter}`
        //getState().pipeline.jobs.push(newJob)
        //getState().pipeline.internalJobCounter += 1
        dispatch(addJob(newJob_))

        // run the job
        runJob(newJob_, dispatch, getState)
    })
}
