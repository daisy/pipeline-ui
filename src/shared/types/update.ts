import { UpdateInfo, ProgressInfo } from 'electron-updater'

export type UpdateState = {
    updateAvailable?: UpdateInfo
    downloadProgress?: ProgressInfo
    updateDownloaded?: boolean
    updateError?: Error
    updateMessage?: string
    manualUpdateAvailable?: boolean
}
