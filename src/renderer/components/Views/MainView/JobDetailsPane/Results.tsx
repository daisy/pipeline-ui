import { Job } from 'shared/types'
import { FileLink } from '../../../Widgets/FileLink'
import { MarkdownDescription } from '../../../Widgets/MarkdownDescription'

export function Results({ job }: { job: Job }) {
    return job.jobData.results?.namedResults.length > 0 ? (
        <ul>
            {job.jobData.results?.namedResults.map((item, itemIndex) => (
                <li key={itemIndex}>
                    <span className="nicename">
                        <FileLink fileHref={item.href}>
                            {item.nicename}
                        </FileLink>
                    </span>
                    {item.desc && (
                        <div className="description">
                            <MarkdownDescription>
                                {item.desc}
                            </MarkdownDescription>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    ) : (
        <p className="info">No results available</p>
    )
}
