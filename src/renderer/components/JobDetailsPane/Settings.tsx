// job settings, not application settings
import { useWindowStore } from 'renderer/store'
import {
    externalLinkClick,
    findValue,
    getAllOptional,
    getAllRequired,
} from 'renderer/utils/utils'
import { Job } from 'shared/types'

const { App } = window

export function Settings({ job }: { job: Job }) {
    const { pipeline } = useWindowStore()
    const scriptDetails = pipeline.scripts.filter(
        (s) => s.id == job.jobData.script.id
    )[0]
    if (!scriptDetails) {
        return <p>Unrecognized script {job.jobData.script.id}</p>
    }

    return (
        <ul>
            <li>
                <span>Script name:</span>
                <span>
                    {scriptDetails.homepage ? (
                        <a
                            href={scriptDetails.homepage}
                            onClick={(e) => externalLinkClick(e, App)}
                        >
                            {scriptDetails.nicename}
                        </a>
                    ) : (
                        scriptDetails.nicename
                    )}
                </span>
            </li>
            {getAllRequired(scriptDetails).map((item, idx) => (
                <li key={idx}>
                    <span>{item.nicename}: </span>
                    <span>
                        {findValue(item.name, item.kind, job.jobRequest)}
                    </span>
                </li>
            ))}
            {getAllOptional(scriptDetails).map((item, idx) => (
                <li key={idx}>
                    <span>{item.nicename}: </span>
                    <span>
                        {findValue(item.name, item.kind, job.jobRequest)}
                    </span>
                </li>
            ))}
        </ul>
    )
}
