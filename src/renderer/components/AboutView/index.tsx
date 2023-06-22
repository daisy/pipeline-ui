import { useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { externalLinkClick } from 'renderer/utils'
import { PipelineStatus } from 'shared/types/pipeline'
import { Copy } from '../SvgIcons'
import daisyLogo from './daisy_high.jpg'
import pipelineLogo from './logo_64x64.png'
import packageJson from '../../../../package.json'

export function AboutView({ title }) {
    const { App } = window

    const { pipeline } = useWindowStore()
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
            <p>
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
                    className="copy"
                    title="Copy information to clipboard"
                    onClick={(e) => copyToClipboard(e)}
                >
                    <Copy width="30" height="30" />
                </button>
            </p>
            <button onClick={(e) => closeAboutBox()}>Close</button>
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
