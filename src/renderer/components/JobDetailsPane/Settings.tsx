// job settings, not application settings
import { useWindowStore } from 'renderer/store'
import { findValue, getAllOptional, getAllRequired } from 'renderer/utils/utils'
import { Job } from 'shared/types'

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
