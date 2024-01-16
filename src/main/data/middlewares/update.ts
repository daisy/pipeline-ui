import { dialog, shell } from 'electron'
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
    setManualUpdateAvailable,
    openLastReleasePage,
} from 'shared/data/slices/update'
import { error, info } from 'electron-log'
import { CancellationToken, ProgressInfo, autoUpdater } from 'electron-updater'
import { ENVIRONMENT } from 'shared/constants'
import packageJson from '../../../../package.json'

import fetch, { Response } from 'node-fetch'
import { setAutoCheckUpdate } from 'shared/data/slices/settings'

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
        dispatch(setAutoCheckUpdate(false))
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
                    if (action.payload === true ||
                        (
                            ( !ENVIRONMENT.IS_DEV ||
                                autoUpdater.forceDevUpdateConfig) && 
                            !update.updateError
                        )
                    ) {
                        dispatch(setUpdateMessage('Checking for automatic updates ...'))
                        autoUpdater
                            .checkForUpdates()
                            .then((res) => {
                                if (res && res.updateInfo) {
                                    dispatch(setUpdateAvailable(res.updateInfo))
                                } else {
                                    dispatch(
                                        setUpdateMessage('No automatic updates available')
                                    )
                                }
                            })
                            .catch((v) => {
                                dispatch(setUpdateMessage('Checking for manual updates ...'))
                                // Assuming releases tags will follow major.minor.patch
                                // for official release
                                // (while RC or beta version would remain marked as pre-release)
                                const { major, minor, patch } =
                                    packageJson.version.match(
                                        /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/
                                    ).groups
                                // Quick version check assuming each part is unsigned byte
                                const currentVersion =
                                    (+major << 16) | (+minor << 8) | +patch
                                // TODO : might need to change this for forks (hardcoded github repo url), 
                                fetch(
                                    `https://github.com/daisy/${packageJson.name}/releases/latest`
                                )
                                    .then((response) => response.url)
                                    .then((lastReleaseUrl) => {
                                        // we assume the last part of the redirect url is
                                        // the tag containing the major.minor.patch pattern
                                        const parts = lastReleaseUrl.split('/')
                                        const tag = parts[parts.length - 1]
                                        const found = tag.match(
                                            /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/
                                        )
                                        if (!found || !found.groups)
                                            throw Error(
                                                'last release url did not ended by a major.minor.patch formated tag'
                                            )

                                        const lastReleaseVersion =
                                            (+found.groups.major << 16) |
                                            (+found.groups.minor << 8) |
                                            +found.groups.patch
                                        if (
                                            currentVersion < lastReleaseVersion
                                        ) {
                                            dispatch(
                                                setManualUpdateAvailable(true)
                                            )
                                            dispatch(
                                                setUpdateMessage(
                                                    `A new version (${tag}) is available to download`
                                                )
                                            )
                                        } else {
                                            dispatch(
                                                setUpdateMessage(
                                                    'No updates available on Github'
                                                )
                                            )
                                        }
                                    })
                                    .catch((err) => {
                                        dispatch(setUpdateError(err))
                                        dispatch(
                                            setUpdateMessage(
                                                'Updates could not be retrieved'
                                            )
                                        )
                                    })
                            })
                    }
                    break
                case openLastReleasePage.type:
                    shell.openExternal(
                        `https://github.com/daisy/${packageJson.name}/releases/latest`
                    )
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
                case setUpdateMessage.type:
                    info('Update message : ' + action.payload)
                    break
                case setUpdateError.type:
                    error('An error occured during the update process : ' + JSON.stringify(action.payload))
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
