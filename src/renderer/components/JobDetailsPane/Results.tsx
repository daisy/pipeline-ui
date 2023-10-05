import { Job } from 'shared/types'
import { FileLink } from '../FileLink'

export function Results({ job }: { job: Job }) {
    return (
        <ul aria-live="polite" className="file-list">
            {job.jobData.results?.namedResults.map((item, itemIndex) => (
                <li key={`result-${itemIndex}`} className="named-result">
                    <FileLink fileHref={item.href}>
                        <span className="nicename">{item.nicename}</span>
                    </FileLink>
                    <span className="description">{item.desc}</span>
                </li>
            ))}
        </ul>
    )
}
