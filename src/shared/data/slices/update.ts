import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { UpdateInfo, ProgressInfo } from 'electron-updater'
import { UpdateState } from 'shared/types'
import { RootState } from 'shared/types/store'

export const update = createSlice({
    name: 'update',
    initialState: {
        downloadProgress: null,
        updateAvailable: null,
        updateDownloaded: false,
        updateError: null,
        updateMessage: null,
        manualUpdateAvailable: false,
    } as UpdateState,
    reducers: {
        setUpdateAvailable: (
            state: UpdateState,
            action: PayloadAction<UpdateInfo | null>
        ) => {
            state.updateAvailable = action.payload
        },
        setUpdateError: (
            state: UpdateState,
            action: PayloadAction<Error | null>
        ) => {
            state.updateError = action.payload
        },
        setUpdateMessage: (
            state: UpdateState,
            action: PayloadAction<string | null>
        ) => {
            state.updateMessage = action.payload
        },
        setManualUpdateAvailable: (
            state: UpdateState,
            action: PayloadAction<boolean>
        ) => {
            state.manualUpdateAvailable = action.payload
        },
        openLastReleasePage: () => {
            // openLastReleasePage action to trigger middleware action to open github release page
        },
        setDownloadProgress: (
            state: UpdateState,
            action: PayloadAction<ProgressInfo | null>
        ) => {
            state.downloadProgress = action.payload
        },
        setUpdateDownloaded: (
            state: UpdateState,
            action: PayloadAction<boolean>
        ) => {
            state.updateDownloaded = action.payload
        },
        checkForUpdate: (
            state: UpdateState,
            action: PayloadAction<boolean | null>
        ) => {
            // checkForUpdate action to trigger middleware check for update
            // can received a boolean for manual update
        },
        cancelInstall: (state: UpdateState) => {
            // cancelDownload action to trigger middleware action to cancel download of the update
        },
        startInstall: (
            state: UpdateState,
            action: PayloadAction<boolean | null>
        ) => {
            // startInstall action to trigger middleware action to install the update either now or when the app closes
            // can receive a boolean for manual install
        },
    },
})

export const {
    setUpdateAvailable,
    setDownloadProgress,
    setUpdateDownloaded,
    setUpdateError,
    setUpdateMessage,
    checkForUpdate,
    cancelInstall,
    startInstall,
    setManualUpdateAvailable,
    openLastReleasePage,
} = update.actions

export const selectors = {
    selectUpdateState: (s: RootState) => s.update,
    selectUpdateAvailable: (s: RootState) => s.update.updateAvailable,
    selectDownloadProgress: (s: RootState) => s.update.downloadProgress,
    selectUpdateDownloaded: (s: RootState) => s.update.updateDownloaded,
    selectUpdateError: (s: RootState) => s.update.updateError,
    selectUpdateMessage: (s: RootState) => s.update.updateMessage,
    selectManualUpdateAvailable: (s: RootState) =>
        s.update.manualUpdateAvailable,
}
// prettier-ignore
export const {
    selectUpdateState,
    selectUpdateAvailable,
    selectDownloadProgress,
    selectUpdateDownloaded,
    selectUpdateError,
    selectUpdateMessage,
    selectManualUpdateAvailable
} = selectors
