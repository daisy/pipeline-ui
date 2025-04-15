import { Script } from 'shared/types'
import { externalLinkClick } from 'renderer/utils/utils'
import { isScriptTTSEnhanced } from 'shared/utils'
const { App } = window

export function ScriptName({
    script,
    headerId,
}: {
    script: Script
    headerId: string
}) {
    return (
        <>
            <h1 id={headerId}>
                {script?.nicename}
                {isScriptTTSEnhanced(script) ? ' (TTS Enhanced)' : ''}
            </h1>
            <p>
                {script?.description}
                {script?.inputs.find((i) =>
                    i.mediaType.includes(
                        'application/vnd.pipeline.tts-config+xml'
                    )
                )
                    ? '. Text can be recorded in TTS voices.'
                    : ''}
                {script?.homepage ? (
                    <a
                        href={script.homepage}
                        onClick={(e) => externalLinkClick(e, App)}
                    >
                        Learn more.
                    </a>
                ) : (
                    ''
                )}
            </p>
        </>
    )
}
