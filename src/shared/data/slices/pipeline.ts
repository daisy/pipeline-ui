import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import {
    Job,
    PipelineStatus,
    Script,
    Webservice,
    PipelineState,
    baseurl,
    JobData,
    JobState,
    JobRequest,
    Datatype,
} from 'shared/types'

import { RootState } from 'shared/types/store'

const initialState = {
    status: PipelineStatus.STOPPED,
    webservice: null,
    scripts: [],
    datatypes: [],
    jobs: [],
    internalJobCounter: 0,
    selectedJobId: '',
} as PipelineState

export const pipeline = createSlice({
    name: 'pipeline',
    initialState,
    reducers: {
        setState: (
            state: PipelineState,
            param: PayloadAction<PipelineState>
        ) => {
            if (param.payload.webservice)
                state.webservice = param.payload.webservice
            if (param.payload.status) state.status = param.payload.status
            if (param.payload.jobs) state.jobs = param.payload.jobs
            if (param.payload.scripts) state.scripts = param.payload.scripts
        },
        /**
         * Start the pipeline.
         *
         * (Middleware handled action, that will create an instance from settings if necessary and then start it)
         * @param state
         */
        start: (state: PipelineState, action?: PayloadAction<Webservice>) => {
            if (action.payload) {
                state.webservice = action.payload
            }
        },

        /**
         * Stop the pipeline instance
         *
         * (Middleware handled action )
         * @param state current pipeline state
         * @param action payload with a boolean : if true, then app is closing
         */
        stop: (state: PipelineState, action?: PayloadAction<boolean>) => {},
        /**
         * Set a new webservice to use
         *
         * (Middleware handled action )
         * @param state
         * @param param
         */
        useWebservice: (
            state: PipelineState,
            param: PayloadAction<Webservice>
        ) => {
            state.webservice = param.payload
        },
        setStatus: (
            state: PipelineState,
            param: PayloadAction<PipelineStatus>
        ) => {
            state.status = param.payload
        },
        setScripts: (
            state: PipelineState,
            param: PayloadAction<Array<Script>>
        ) => {
            state.scripts = param.payload
        },
        setDatatypes: (
            state: PipelineState,
            param: PayloadAction<Array<Datatype>>
        ) => {
            state.datatypes = param.payload
        },
        setJobs: (state: PipelineState, param: PayloadAction<Array<Job>>) => {
            state.jobs = param.payload
        },
        addJob: (state: PipelineState, param: PayloadAction<Job>) => {
            // Avoid duplicated additions
            // internal id is supposed to be unique
            if (
                state.jobs.filter(
                    (j) => j.internalId == param.payload.internalId
                ).length == 0
            ) {
                state.jobs.push(param.payload)
                state.internalJobCounter += 1
            }
        },
        editJob: (state: PipelineState, param: PayloadAction<Job>) => {
            // Create a new job to backup
            const temp = newJob(state)
            state.jobs.push({
                ...param.payload,
                internalId: temp.internalId,
                invisible: true,
            })
            state.jobs = state.jobs.map((job) => {
                if (job.internalId == param.payload.internalId) {
                    job.linkedTo = temp.internalId
                    job.state = JobState.NEW
                    if (job.jobData && job.jobData.results) {
                        job.jobData.results = undefined
                    }
                }
                return job
            })
        },
        restoreJob: (state: PipelineState, param: PayloadAction<Job>) => {
            const currentJobIndex = state.jobs.findIndex(
                (j) => j.internalId == param.payload.internalId
            )
            const jobToRestore = state.jobs.find(
                (j) => j.internalId == param.payload.linkedTo
            )
            console.log(currentJobIndex, jobToRestore)
            if (currentJobIndex > -1 && jobToRestore) {
                state.jobs[currentJobIndex] = {
                    ...jobToRestore,
                    internalId: param.payload.internalId,
                    invisible: false,
                }
                state.jobs = state.jobs.filter(
                    (job) => job.internalId !== jobToRestore.internalId
                )
            }
        },
        updateJob: (state: PipelineState, param: PayloadAction<Job>) => {
            state.jobs = state.jobs.map((job) => {
                return job.internalId === param.payload.internalId
                    ? param.payload
                    : job
            })
        },
        removeJob: (state: PipelineState, param: PayloadAction<Job>) => {
            const searchedJob = param.payload

            // reassign the selection if we are removing the selected job
            if (searchedJob.internalId == state.selectedJobId) {
                let selectedJobIndex = state.jobs.findIndex(
                    (j) => j.internalId == state.selectedJobId
                )
                if (selectedJobIndex - 1 >= 0) {
                    selectedJobIndex--
                } else {
                    selectedJobIndex = state.jobs.length - 1
                }
                console.log(selectedJobIndex)
                state.selectedJobId = state.jobs[selectedJobIndex].internalId
            }
            state.jobs = state.jobs.filter(
                (job) => job.internalId !== searchedJob.internalId
            )
        },
        runJob: (state: PipelineState, param: PayloadAction<Job>) => {
            if (param.payload.jobRequest) {
                // Retrieve latest JobRequest payload
                // the runAction will be intercepted by the middleware
                // To make the required api calls
                state.jobs = state.jobs.map((job) => {
                    return job.internalId === param.payload.internalId
                        ? {
                              ...job,
                              jobRequest: param.payload.jobRequest,
                          }
                        : job
                })
            }
        },
        // for the tabbed view and menu list
        // this could have gone in its own state slice but it depends on pipeline.jobs anyway
        // and i'm not sure how redux handles dependent states across slices
        selectJob: (state: PipelineState, param: PayloadAction<Job>) => {
            let job = state.jobs.find(
                (j) => j.internalId == param.payload.internalId
            )
            if (job) {
                state.selectedJobId = job.internalId
            }
        },
        selectNextJob: (state: PipelineState) => {
            let selectedJobIndex = state.jobs.findIndex(
                (j) => j.internalId == state.selectedJobId
            )
            if (selectedJobIndex + 1 <= state.jobs.length - 1) {
                selectedJobIndex++
            } else {
                selectedJobIndex = 0
            }
            state.selectedJobId = state.jobs[selectedJobIndex].internalId
        },
        selectPrevJob: (state: PipelineState) => {
            console.log('select prev job')
            let selectedJobIndex = state.jobs.findIndex(
                (j) => j.internalId == state.selectedJobId
            )
            if (selectedJobIndex - 1 >= 0) {
                selectedJobIndex--
            } else {
                selectedJobIndex = state.jobs.length - 1
            }
            console.log(selectedJobIndex)
            state.selectedJobId = state.jobs[selectedJobIndex].internalId
        },
    },
})

export default pipeline.reducer

export const {
    setState,
    start,
    stop,
    useWebservice,
    setStatus,
    setJobs,
    setScripts,
    setDatatypes,
    addJob,
    editJob,
    updateJob,
    runJob,
    restoreJob,
    removeJob,
    selectJob,
    selectNextJob,
    selectPrevJob,
} = pipeline.actions

export const selectors = {
    selectPipeline: (s: RootState) => s.pipeline,
    selectStatus: (state: RootState) => state.pipeline.status,
    selectWebservice: (state: RootState) => state.pipeline.webservice,
    selectJobs: (state: RootState) => state.pipeline.jobs,
    selectScripts: (state: RootState) => state.pipeline.scripts,
    selectDatatypes: (state: RootState) => state.pipeline.datatypes,
    newJob: (pipeline: PipelineState) =>
        ({
            internalId: `job-${pipeline.internalJobCounter}`,
            state: JobState.NEW,
            jobRequest: null,
        } as Job),
}

export const {
    selectPipeline,
    selectStatus,
    selectWebservice,
    selectJobs,
    selectScripts,
    selectDatatypes,
    newJob,
} = selectors
