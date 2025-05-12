import {MarkdownDescription} from './MarkdownDescription'
const { App } = window

export function CustomFieldDocumentation({ datatypes }) {
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
                {allDocumentation.map((d, idx) => {
                    return (
                        <>
                            <li key={idx}>
                                {d.summary}
                                <div className="details">
                                    {d.details ? (
                                        <MarkdownDescription>{d.details}</MarkdownDescription>
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
