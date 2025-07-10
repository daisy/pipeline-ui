import { useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { externalLinkClick } from 'renderer/utils'
import { PipelineStatus } from 'shared/types'
import { Copy } from '../../Widgets/SvgIcons'
import pipelineLogo from './logo_64x64.png'
import packageJson from '../../../../../package.json'
import { UpdateState } from 'shared/types'
import {
    startInstall,
    cancelInstall,
    checkForUpdate,
    openLastReleasePage,
} from 'shared/data/slices/update'

const { App } = window

const UpdateButton = (update: UpdateState) => {
    if (update.downloadProgress) {
        return (
            <>
                <progress
                    id="update-download-progress"
                    max="100"
                    value={update.downloadProgress.percent}
                >
                    {update.downloadProgress.percent}%
                </progress>
                {update.downloadProgress.percent < 100 && (
                    <button
                        type="button"
                        id="cancel-download"
                        title="Cancel download"
                        onClick={() => {
                            App.store.dispatch(cancelInstall())
                        }}
                    >
                        Cancel
                    </button>
                )}
            </>
        )
    } else if (update.updateAvailable) {
        return (
            <button
                type="button"
                id="start-install"
                title={`Update to ${update.updateAvailable.version}`}
                onClick={() => {
                    App.store.dispatch(startInstall(true))
                }}
            >
                Update to {update.updateAvailable.version}
            </button>
        )
    } else if (update.manualUpdateAvailable === true) {
        return (
            <button
                type="button"
                id="open-release-page"
                title={`Open the release page`}
                onClick={() => {
                    App.store.dispatch(openLastReleasePage())
                }}
            >
                Open the new release page
            </button>
        )
    } else {
        return (
            <button
                type="button"
                id="check-update"
                title="Check for updates"
                onClick={() => {
                    App.store.dispatch(checkForUpdate(true))
                }}
            >
                Check for updates
            </button>
        )
    }
}

export function AboutView({ title }) {
    const { App } = window

    const { pipeline, update } = useWindowStore()
    let version = packageJson.version
    let engineVersion = pipeline.alive?.version

    let closeAboutBox = () => {
        window.close()
    }

    let handleKeyPress = (e) => {
        // esc to close the about box
        if (e.keyCode == 27) {
            e.preventDefault()
            closeAboutBox()
        }
    }

    let engineStatus = pipelineEngineStatus()

    let copyToClipboard = (e) => {
        let info = `App version: ${version}, 
        Engine version: ${engineVersion}, 
        Engine is ${engineStatus.status} ${
            engineStatus.status == PipelineStatus.RUNNING
                ? ` on ${engineStatus.address}`
                : ''
        }
        `
        App.copyToClipboard(info)
    }

    useEffect(() => {
        App.store.dispatch(checkForUpdate())
    }, [])

    useEffect(() => {
        document.addEventListener('keydown', (e) => {
            handleKeyPress(e)
        })
    }, [handleKeyPress])

    return (
        <main className="about">
            <h1>{title}</h1>
            <img src={pipelineLogo} alt="DAISY Pipeline logo" />
            <a
                href="https://daisy.org/pipeline"
                onClick={(e) => externalLinkClick(e, App)}
            >
                Visit the DAISY Pipeline homepage
            </a>
            <p className="versions">
                <ul>
                    <li>App version: {version}</li>
                    <li>Engine version: {engineVersion}</li>
                    <li>
                        Engine is{'  '}
                        <span>
                            {engineStatus.status == PipelineStatus.RUNNING ? (
                                <>
                                    <b>{engineStatus.status}</b> on{' '}
                                    <code>{engineStatus.address}</code>
                                </>
                            ) : (
                                <>{engineStatus.status}</>
                            )}
                        </span>
                    </li>
                </ul>
                <button
                    type="button"
                    className="copy invisible"
                    title="Copy information to clipboard"
                    onClick={(e) => copyToClipboard(e)}
                >
                    <Copy width="30" height="30" />
                </button>
            </p>
            <div className="actions">
                {update.updateMessage && (
                    <p className="updateMessage">
                        <label
                            {...(update.downloadProgress
                                ? { htmlFor: 'update-download-progress' }
                                : {})}
                        >
                            {update.updateMessage}
                        </label>
                    </p>
                )}
                <div>
                    {UpdateButton(update)}
                    <button type="button" onClick={(e) => closeAboutBox()}>
                        Close
                    </button>
                </div>
            </div>
        </main>
    )
}

function pipelineEngineStatus() {
    const { pipeline } = useWindowStore()
    let address = pipeline.webservice
        ? `${pipeline.webservice.host}:${pipeline.webservice.port}${pipeline.webservice.path}`
        : ``
    return { status: pipeline.status, address }
}
