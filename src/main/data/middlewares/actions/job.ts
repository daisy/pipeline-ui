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

export function removeJobs(action) {
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

export function removeJob(action, dispatch, state) {
    let removedJob = action.payload as Job
    const currentJobs = selectJobs(state)
    const visibleJobs = selectVisibleJobs(state)

    if (
        removedJob.jobRequest &&
        (state.settings.editJobOnNewTab || !removedJob.invisible)
    ) {
        // Ask delete confirmation for visible jobs deletion
        const result = dialog.showMessageBoxSync(MainWindowInstance, {
            message: `Are you sure you want to close this job ?`,
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
            dispatch(addJob(newJob(selectPipeline(state))))
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
    if (action && removedJob.linkedTo && !state.settings.editJobOnNewTab) {
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

export function runJob(action, dispatch, getState) {
    // Launch the job with the API and start monitoring its execution
    // Also change its state to submited
    const jobToRun = action.payload as Job
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
