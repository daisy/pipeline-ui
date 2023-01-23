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
} from 'shared/types'

import { RootState } from 'shared/types/store'

const initialState = {
    status: PipelineStatus.STOPPED,
    webservice: null,
    scripts: [],
    jobs: [],
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
            }
        },
        updateJob: (state: PipelineState, param: PayloadAction<Job>) => {
            state.jobs = state.jobs = state.jobs.map((job) => {
                return job.internalId === param.payload.internalId
                    ? param.payload
                    : job
            })
        },
        removeJob: (
            state: PipelineState,
            param: PayloadAction<Job | string>
        ) => {
            const searchedId =
                typeof param.payload === 'string'
                    ? param.payload
                    : param.payload.internalId

            state.jobs = state.jobs.filter(
                (job) => job.internalId !== searchedId
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
    },
})

export default pipeline.reducer

export const {
    setState,
    useWebservice,
    setStatus,
    setJobs,
    setScripts,
    addJob,
    updateJob,
    runJob,
    removeJob,
} = pipeline.actions

export const selectors = {
    selectPipeline: (s: RootState) => s.pipeline,
    selectStatus: (state: RootState) => state.pipeline.status,
    selectWebservice: (state: RootState) => state.pipeline.webservice,
    selectJobs: (state: RootState) => state.pipeline.jobs,
    selectScripts: (state: RootState) => state.pipeline.scripts,
}

export const {
    selectPipeline,
    selectStatus,
    selectWebservice,
    selectJobs,
    selectScripts,
} = selectors
