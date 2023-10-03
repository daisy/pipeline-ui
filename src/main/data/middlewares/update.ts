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

import { CancellationToken, autoUpdater } from 'electron-updater'

/**
 * Middleware to manage updates
 * @param param0
 * @returns
 */
export function updateMiddleware({ getState, dispatch }) {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.forceDevUpdateConfig = true
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
                            console.log('error during version check : ', v)
                        })
                    break
                case setUpdateAvailable.type:
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
                        console.log('started dispatch without payload')
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
                        break
                    }
                case cancelInstall.type:
                    if (cancelationToken != null) {
                        cancelationToken.cancel()
                        cancelationToken = null
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
