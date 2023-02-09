import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
    ApplicationSettings,
    ColorScheme,
    PipelineInstanceProperties,
} from 'shared/types'
import { RootState } from 'shared/types/store'

export const settings = createSlice({
    name: 'settings',
    initialState: {
        // Default settings requires some nodejs only methods
        // initialization and real default state is in the middleware readSettings()
        downloadFolder: undefined,
        runLocalPipeline: false,
        localPipelineProps: undefined,
        useRemotePipeline: false,
        remotePipelineWebservice: undefined,
        colorScheme: 'system',
    } as ApplicationSettings,
    reducers: {
        // general state changer, not recommended based on how redux works
        setSettings: (
            state: ApplicationSettings,
            action: PayloadAction<ApplicationSettings>
        ) => {
            if (action.payload.downloadFolder)
                state.downloadFolder = action.payload.downloadFolder
            if (action.payload.runLocalPipeline)
                state.runLocalPipeline = action.payload.runLocalPipeline
            if (action.payload.localPipelineProps)
                state.localPipelineProps = action.payload.localPipelineProps
            if (action.payload.useRemotePipeline)
                state.useRemotePipeline = action.payload.useRemotePipeline
            if (action.payload.colorScheme)
                state.colorScheme = action.payload.colorScheme
        },
        save: (state: ApplicationSettings) => {
            // save action to trigger middleware save on disk
        },
        setDownloadPath: (
            state: ApplicationSettings,
            action: PayloadAction<string>
        ) => {
            state.downloadFolder = action.payload
        },
        setPipelineProperties: (
            state: ApplicationSettings,
            action: PayloadAction<PipelineInstanceProperties>
        ) => {
            state.localPipelineProps = action.payload
        },
        setColorScheme: (
            state: ApplicationSettings,
            action: PayloadAction<keyof typeof ColorScheme>
        ) => {
            state.colorScheme = action.payload
        },
    },
})

export const {
    save,
    setDownloadPath,
    setSettings,
    setPipelineProperties,
    setColorScheme,
} = settings.actions

export const selectors = {
    selectSettings: (s: RootState) => s.settings,
    selectDownloadPath: (state: RootState) => state.settings.downloadFolder,
    selectPipelineProperties: (s: RootState) => s.settings.localPipelineProps,
    shouldRunLocalPipeline: (s: RootState) => s.settings.runLocalPipeline,
    selectColorScheme: (s: RootState) => s.settings.colorScheme,
}
// prettier-ignore
export const {
    selectSettings,
    selectDownloadPath,
    selectPipelineProperties,
    shouldRunLocalPipeline,
    selectColorScheme
} = selectors
