import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
    ApplicationSettings,
    ClosingMainWindowAction,
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
        // Local pipeline properties
        pipelineInstanceProps: {
            pipelineType: 'embedded',
            webservice: {
                // Note : localhost resolve as ipv6 ':::' in nodejs, but we need ipv4 for the pipeline
                host: '127.0.0.1',
                port: 0,
                path: '/ws',
            },
        } as PipelineInstanceProperties,
        colorScheme: 'system',
        onClosingMainWindow: undefined, // Undeterminate to display the app-opening dialog
        editJobOnNewTab: true,
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
            if (action.payload.pipelineInstanceProps)
                state.pipelineInstanceProps =
                    action.payload.pipelineInstanceProps
            if (action.payload.colorScheme)
                state.colorScheme = action.payload.colorScheme
            if (action.payload.onClosingMainWindow)
                state.onClosingMainWindow = action.payload.onClosingMainWindow
            if (action.payload.editJobOnNewTab)
                state.editJobOnNewTab = action.payload.editJobOnNewTab
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
            state.pipelineInstanceProps = action.payload
        },
        setColorScheme: (
            state: ApplicationSettings,
            action: PayloadAction<keyof typeof ColorScheme>
        ) => {
            state.colorScheme = action.payload
        },
        setClosingMainWindowAction: (
            state: ApplicationSettings,
            action: PayloadAction<keyof typeof ClosingMainWindowAction>
        ) => {
            state.onClosingMainWindow = action.payload
        },
        setEditJobOnNewTab: (
            state: ApplicationSettings,
            action: PayloadAction<boolean>
        ) => {
            state.editJobOnNewTab = action.payload
        },
        setTtsConfig: (
            state: ApplicationSettings,
            action: PayloadAction<TtsConfig>
        ) => {
            state.ttsConfig = action.payload
        },
        setSponsorshipMessageLastShown: (
            state: ApplicationSettings,
            action: PayloadAction<string>
        ) => {
            state.sponsorshipMessageLastShown = action.payload
        },
    },
})

export const {
    save,
    setDownloadPath,
    setSettings,
    setPipelineProperties,
    setColorScheme,
    setClosingMainWindowAction,
    setTtsConfig,
    setAutoCheckUpdate,
    setEditJobOnNewTab,
    setSponsorshipMessageLastShown,
} = settings.actions

export const selectors = {
    selectSettings: (s: RootState) => s.settings,
    selectDownloadPath: (state: RootState) => state.settings.downloadFolder,
    selectPipelineProperties: (s: RootState) =>
        s.settings.pipelineInstanceProps,
    selectColorScheme: (s: RootState) => s.settings.colorScheme,
    selectClosingAction: (s: RootState) => s.settings.onClosingMainWindow,
    selectEditOnNewTab: (s: RootState) => s.settings.editJobOnNewTab,
    selectTtsConfig: (s: RootState) => s.settings.ttsConfig,
    selectAutoCheckUpdate: (s: RootState) => s.settings.autoCheckUpdate,
}
// prettier-ignore
export const {
    selectSettings,
    selectDownloadPath,
    selectPipelineProperties,
    selectColorScheme,
    selectClosingAction,
    selectTtsConfig,
    selectAutoCheckUpdate,
    selectEditOnNewTab,
} = selectors
