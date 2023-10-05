import { Job } from 'shared/types'
import { FileLink } from '../FileLink'
import remarkGfm from 'remark-gfm'
import { externalLinkClick } from 'renderer/utils'
import Markdown from 'react-markdown'
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
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // override the rendering of link elements with a link element that opens in an external browser
                                a: (props) => {
                                    return (
                                        <a
                                            href={props.href}
                                            onClick={(e) =>
                                                externalLinkClick(e, App)
                                            }
                                        >
                                            {props.children}
                                        </a>
                                    )
                                },
                            }}
                        >
                            {item.desc}
                        </Markdown>
                    </div>
                </li>
            ))}
        </ul>
    )
}
