import remarkGfm from 'remark-gfm'
import { externalLinkClick } from 'renderer/utils'
import Markdown from 'react-markdown'
const { App } = window

export function CustomFieldDocumentation({ datatypes }) {
    console.log(datatypes)

    let allDocumentation = datatypes.map((dt) => {
        let summary =
            dt.documentation.indexOf('\n\n') != -1
                ? dt.documentation.split('\n\n')[0]
                : dt.documentation
        let details =
            dt.documentation.indexOf('\n\n') != -1
                ? dt.documentation.slice(dt.documentation.indexOf('\n\n') + 1)
                : ''
        return { summary, details }
    })

    return (
        <details className="documentation">
            <summary>Allowed values</summary>
            <ul>
                {allDocumentation.map((d) => {
                    return (
                        <>
                            <li>
                                {d.summary}
                                <div className="details">
                                    {d.details ? (
                                        <Markdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                // override the rendering of link elements with a link element that opens in an external browser
                                                a: (props) => {
                                                    return (
                                                        <a
                                                            href={props.href}
                                                            onClick={(e) =>
                                                                externalLinkClick(
                                                                    e,
                                                                    App
                                                                )
                                                            }
                                                        >
                                                            {props.children}
                                                        </a>
                                                    )
                                                },
                                            }}
                                        >
                                            {d.details}
                                        </Markdown>
                                    ) : (
                                        ''
                                    )}
                                </div>
                            </li>
                        </>
                    )
                })}
            </ul>
        </details>
    )
}
