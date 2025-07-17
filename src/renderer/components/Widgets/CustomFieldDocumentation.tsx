import { MarkdownDescription } from './MarkdownDescription'
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
        // <details className="documentation">
        //     <summary>Allowed values</summary>
        <div className="custom-documentation">
            {allDocumentation.length > 1 ? (
                <>
                    <p>Allowed values:</p>
                    <ul>
                        {allDocumentation.map((d, idx) => {
                            return (
                                <>
                                    <li key={idx}>
                                        <CustomFieldDocumentationItem docitem={d} />
                                    </li>
                                </>
                            )
                        })}
                    </ul>
                </>
            ) : (
                <><p>Allowed syntax:</p>
                <CustomFieldDocumentationItem docitem={allDocumentation[0]} />
                </>
            )}
        </div>
        // </details>
    )
}

function CustomFieldDocumentationItem({ docitem }) {
    return (
        <>
            {docitem.summary}
            <div className="details">
                {docitem.details ? (
                    <MarkdownDescription>{docitem.details}</MarkdownDescription>
                ) : (
                    ''
                )}
            </div>
        </>
    )
}
