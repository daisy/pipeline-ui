import { dialog } from 'electron'
import { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'shared/types/store'
import {
    checkForUpdate,
    startInstall,
    setUpdateAvailable,
    setDownloadProgress,
    setUpdateError,
    setUpdateMessage,
    cancelInstall,
    setUpdateDownloaded,
} from 'shared/data/slices/update'

import { CancellationToken, ProgressInfo, autoUpdater } from 'electron-updater'
import { ENVIRONMENT } from 'shared/constants'

/**
 * Middleware to manage updates
 * @param param0
 * @returns
 */
export function updateMiddleware({ getState, dispatch }) {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    if (ENVIRONMENT.IS_DEV) {
        //autoUpdater.forceDevUpdateConfig = true
    }
    autoUpdater.on('download-progress', (progress) => {
        dispatch(setUpdateDownloaded(false))
        dispatch(setDownloadProgress(progress))
    })
    autoUpdater.on('update-downloaded', (downloaded) => {
        dispatch(setUpdateDownloaded(true))
    })
    autoUpdater.on('error', (error, message) => {
        dispatch(setUpdateDownloaded(false))
        dispatch(setDownloadProgress(null))
        dispatch(setUpdateError(error))
        dispatch(setUpdateMessage(message))
    })
    let userIsWarnedAboutUpdate = false
    let cancelationToken: CancellationToken = null
    return (next) => (action: PayloadAction<any>) => {
        const returnValue = next(action)
        const { update } = getState() as RootState
        try {
            switch (action.type) {
                case checkForUpdate.type:
                    if (action.payload === true) {
                        userIsWarnedAboutUpdate = false
                    }
                    if (
                        !ENVIRONMENT.IS_DEV ||
                        autoUpdater.forceDevUpdateConfig
                    ) {
                        dispatch(setUpdateMessage('Checking for updates ...'))
                        autoUpdater
                            .checkForUpdates()
                            .then((res) => {
                                if (res && res.updateInfo) {
                                    dispatch(setUpdateAvailable(res.updateInfo))
                                } else {
                                    dispatch(
                                        setUpdateMessage('No updates available')
                                    )
                                }
                            })
                            .catch((v) => {
                                dispatch(
                                    setUpdateMessage(
                                        'error during update check : ' +
                                            JSON.stringify(v)
                                    )
                                )
                            })
                    } else {
                        dispatch(setUpdateMessage('Updates are deactivated.'))
                        //// uncomment the followin block to test progress bar
                        // dispatch(
                        //     setDownloadProgress({
                        //         bytesPerSecond: 125256,
                        //         percent: 50,
                        //         total: 145256192,
                        //         transferred: 72628,
                        //         delta: 1,
                        //     })
                        // )
                    }
                    break
                case setUpdateAvailable.type:
                    dispatch(
                        setUpdateMessage(
                            `A new version (${update.updateAvailable.version}) is available`
                        )
                    )
                    if (!userIsWarnedAboutUpdate) {
                        userIsWarnedAboutUpdate = true
                        dialog
                            .showMessageBox(null, {
                                type: 'info',
                                title: 'A new version is available',
                                message:
                                    `A new version (${update.updateAvailable.version}) is available.\r\n` +
                                    'Do you want to download and install the update ?\r\n' +
                                    'The application needs to restart to install.\r\n' +
                                    'You can also manually launch the update later through the About window',
                                buttons: [
                                    'Install when quitting the app',
                                    'Install and restart now',
                                    'Cancel',
                                ],
                            })
                            .then((buttonClicked) => {
                                switch (buttonClicked.response) {
                                    case 0:
                                        // request to install later
                                        autoUpdater.autoInstallOnAppQuit = true
                                    case 1:
                                        // launch install
                                        dispatch(startInstall())
                                        break
                                    case 2:
                                        // request to install later
                                        dispatch(setUpdateMessage(''))
                                        autoUpdater.autoInstallOnAppQuit = true
                                    default:
                                        break
                                }
                            })
                    }
                    break
                case startInstall.type:
                    // manual installation request from abourt
                    if (action.payload === true) {
                        dialog
                            .showMessageBox(null, {
                                type: 'info',
                                title: 'Updating the app',
                                message:
                                    'The application needs to restart to install the update.\r\n' +
                                    'Do you want to install the update now ?',
                                buttons: [
                                    'Install when quitting the app',
                                    'Install and restart now',
                                    'Cancel install',
                                ],
                            })
                            .then((buttonClicked) => {
                                switch (buttonClicked.response) {
                                    case 0:
                                        // request to install later
                                        autoUpdater.autoInstallOnAppQuit = true
                                    case 1:
                                        // confirm install process by relaunching the action without payload
                                        dispatch(startInstall())
                                        break
                                    case 2:
                                        // abort : do not continue the process and avoid autoInstall
                                        dispatch(setUpdateMessage(''))
                                        autoUpdater.autoInstallOnAppQuit = false
                                    default:
                                        break
                                }
                            })
                    } else if (cancelationToken === null) {
                        dispatch(setUpdateMessage(`Downloading ...`))
                        cancelationToken = new CancellationToken()
                        autoUpdater
                            .downloadUpdate(cancelationToken)
                            .then(() => {
                                // if not reqested to install later previously (user clicked on install
                                if (!autoUpdater.autoInstallOnAppQuit) {
                                    autoUpdater.quitAndInstall()
                                } else {
                                    dispatch(
                                        setUpdateMessage(
                                            'The application will update when quitting the app'
                                        )
                                    )
                                }
                                autoUpdater.autoInstallOnAppQuit = false
                                cancelationToken = null
                            })
                            .catch((e) => {
                                dispatch(setUpdateError(e))
                            })
                    }
                    break
                case setDownloadProgress.type:
                    console.log(action.payload)
                    const progress = action.payload as ProgressInfo
                    if (progress != null) {
                        dispatch(
                            setUpdateMessage(
                                `Downloading ... ${(
                                    progress.bytesPerSecond / 1024
                                ).toFixed()} KB/s - ${(
                                    progress.transferred / 1024
                                ).toFixed()} / ${(
                                    progress.total / 1024
                                ).toFixed()} KB`
                            )
                        )
                    }
                    break
                case cancelInstall.type:
                    dispatch(setUpdateMessage(''))
                    if (cancelationToken != null) {
                        cancelationToken.cancel()
                        cancelationToken = null
                        dispatch(setDownloadProgress(null))
                    }
                    break
                default:
                    break
            }
        } catch (e) {
            console.log(e)
        }
        return returnValue
    }
}
