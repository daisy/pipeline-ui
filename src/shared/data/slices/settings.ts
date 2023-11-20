import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
    ApplicationSettings,
    ClosingMainWindowActionForApp,
    ClosingMainWindowActionForJobs,
    ColorScheme,
    PipelineInstanceProperties,
    TtsConfig,
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
        appStateOnClosingMainWindow: undefined,
        jobsStateOnClosingMainWindow: undefined,
        ttsConfig: undefined,
        autoCheckUpdate: true,
    } as ApplicationSettings,
    reducers: {
        // general state changer, not recommended based on how redux works
        setSettings: (
            state: ApplicationSettings,
            action: PayloadAction<ApplicationSettings>
        ) => {
            if (action.payload.downloadFolder)
                state.downloadFolder = action.payload.downloadFolder
            if (action.payload.runLocalPipeline !== undefined)
                state.runLocalPipeline = action.payload.runLocalPipeline
            if (action.payload.localPipelineProps)
                state.localPipelineProps = action.payload.localPipelineProps
            if (action.payload.useRemotePipeline !== undefined)
                state.useRemotePipeline = action.payload.useRemotePipeline
            if (action.payload.colorScheme)
                state.colorScheme = action.payload.colorScheme
            if (action.payload.appStateOnClosingMainWindow)
                state.appStateOnClosingMainWindow =
                    action.payload.appStateOnClosingMainWindow
            if (action.payload.jobsStateOnClosingMainWindow)
                state.jobsStateOnClosingMainWindow =
                    action.payload.jobsStateOnClosingMainWindow
            if (action.payload.ttsConfig)
                state.ttsConfig = action.payload.ttsConfig
            if (action.payload.autoCheckUpdate !== undefined) {
                state.autoCheckUpdate = action.payload.autoCheckUpdate
            }
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
        setAutoCheckUpdate: (
            state: ApplicationSettings,
            action: PayloadAction<boolean>
        ) => {
            state.autoCheckUpdate = action.payload
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
        setClosingMainWindowActionForApp: (
            state: ApplicationSettings,
            action: PayloadAction<keyof typeof ClosingMainWindowActionForApp>
        ) => {
            state.appStateOnClosingMainWindow = action.payload
        },
        setClosingMainWindowActionForJobs: (
            state: ApplicationSettings,
            action: PayloadAction<keyof typeof ClosingMainWindowActionForJobs>
        ) => {
            state.jobsStateOnClosingMainWindow = action.payload
        },
        setTtsConfig: (
            state: ApplicationSettings,
            action: PayloadAction<TtsConfig>
        ) => {
            state.ttsConfig = action.payload
        },
    },
})

export const {
    save,
    setDownloadPath,
    setSettings,
    setPipelineProperties,
    setColorScheme,
    setClosingMainWindowActionForApp,
    setClosingMainWindowActionForJobs,
    setTtsConfig,
    setAutoCheckUpdate,
} = settings.actions

export const selectors = {
    selectSettings: (s: RootState) => s.settings,
    selectDownloadPath: (state: RootState) => state.settings.downloadFolder,
    selectPipelineProperties: (s: RootState) => s.settings.localPipelineProps,
    shouldRunLocalPipeline: (s: RootState) => s.settings.runLocalPipeline,
    selectColorScheme: (s: RootState) => s.settings.colorScheme,
    selectClosingActionForApp: (s: RootState) =>
        s.settings.appStateOnClosingMainWindow,
    selectClosingActionForJobs: (s: RootState) =>
        s.settings.jobsStateOnClosingMainWindow,
    selectTtsConfig: (s: RootState) => s.settings.ttsConfig,
    selectAutoCheckUpdate: (s: RootState) => s.settings.autoCheckUpdate,
}
// prettier-ignore
export const {
    selectSettings,
    selectDownloadPath,
    selectPipelineProperties,
    shouldRunLocalPipeline,
    selectColorScheme,
    selectClosingActionForApp,
    selectClosingActionForJobs,
    selectTtsConfig,
    selectAutoCheckUpdate,
} = selectors
