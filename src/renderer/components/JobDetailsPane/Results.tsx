import { Job } from 'shared/types'
import { FileLink } from '../Widgets/FileLink'
import { MarkdownDescription } from '../Widgets/MarkdownDescription'
const { App } = window

export function Results({ job }: { job: Job }) {
    return (
        <ul aria-live="polite" className="file-list">
            {job.jobData.results?.namedResults.map((item, itemIndex) => (
                <li key={`result-${itemIndex}`} className="named-result">
                    <FileLink fileHref={item.href}>
                        <span className="nicename">{item.nicename}</span>
                    </FileLink>
                    <div className="description">
                        <MarkdownDescription>{item.desc}</MarkdownDescription>
                    </div>
                </li>
            ))}
        </ul>
    )
}
