import { Job } from 'shared/types'

export function Results({ job }: { job: Job }) {
    let handleWebLink = (e) => {
        e.preventDefault()
        App.openInBrowser(e.target.href)
    }

    return (
        <ul aria-live="polite" className="file-list">
            <li>
                {job.jobData.downloadedFolder && (
                    <FileLink fileHref={job.jobData.downloadedFolder}>
                        Results folder
                    </FileLink>
                )}
                <ul>
                    {job.jobData.results?.namedResults.map(
                        (item, itemIndex) => (
                            <li key={`result-${itemIndex}`}>
                                <FileLink fileHref={item.href}>
                                    {item.nicename}
                                </FileLink>
                            </li>
                        )
                    )}
                </ul>
            </li>
            {job?.jobData?.log ? (
                <li>
                    <a href={job.jobData.log} onClick={handleWebLink}>
                        Log
                    </a>
                </li>
            ) : (
                ''
            )}
        </ul>
    )
}

const { App } = window

interface FileLinkProps {
    fileHref: string
    children?: React.ReactNode
}

function FileLink({ fileHref, children }: FileLinkProps) {
    let localPath = fileHref
        ? decodeURI(fileHref.replace('file:', '').replace('///', '/'))
        : ''
    let filename = fileHref ? fileHref.slice(fileHref.lastIndexOf('/') + 1) : ''

    let onClick = (e) => {
        e.preventDefault()
        if (localPath) App.showItemInFolder(localPath)
        else App.openInBrowser(fileHref)
    }

    return (
        <a className="filelink" href="#" onClick={onClick}>
            {children ?? filename}
        </a>
    )
}

function JobResultsFolder({ jobId, results }) {
    // this is a hack!
    // get the first file and use its path to figure out what is probably the output folder for the job
    let file = ''
    if (results?.namedResults.length > 0) {
        if (results.namedResults[0].files.length > 0) {
            file = results.namedResults[0].files[0].file
            let idx = file.indexOf(jobId)
            if (idx != -1) {
                file = file.slice(0, idx + jobId.length) + '/'
            }
        }
    }

    if (file != '') {
        return <FileLink fileHref={file}>Results folder</FileLink>
    } else {
        return <></>
    }
}
