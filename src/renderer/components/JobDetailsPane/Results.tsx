export function Results({ job }) {
    return (
        <ul aria-live="polite">
            {job.jobData.results?.namedResults.map((item, idx) => (
                <li key={idx}>
                    {item.files.length > 1 ? (
                        <>
                            <span>{item.nicename}</span>
                            <ul>
                                {item.files.map((resultFile) => (
                                    <li>
                                        <FileLink fileHref={resultFile.file} />
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <FileLink fileHref={item.files[0]?.file}>
                            {item.nicename}
                        </FileLink>
                    )}
                </li>
            ))}
        </ul>
    )
}

const { App } = window

interface FileLinkProps {
    fileHref: string
    children?: React.ReactNode
}

function FileLink({ fileHref, children }: FileLinkProps) {
    let localPath = decodeURI(fileHref.replace('file:', ''))
    let filename = fileHref.slice(
        fileHref.lastIndexOf('/'),
        fileHref.length - fileHref.lastIndexOf('/')
    )

    let onClick = (e) => {
        e.preventDefault()
        App.showItemInFolder(localPath)
    }

    return (
        <a className="filelink" href="#" onClick={onClick}>
            {children ?? filename}
        </a>
    )
}
