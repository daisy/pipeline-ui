import { MessageLevel } from 'shared/types'
const { App } = window

let messageSort = (a, b) => (a.sequence < b.sequence ? b : a)
let handleWebLink = (e) => {
    e.preventDefault()
    App.openInBrowser(e.target.href)
}

export function Messages({ job }) {
    return (
        <>
            {job?.jobData?.log ? (
                <p>
                    <a href={job.jobData.log} onClick={handleWebLink}>
                        View log
                    </a>
                </p>
            ) : (
                ''
            )}
            <ul aria-live="polite">
                {job.jobData.messages?.sort(messageSort).map((message, idx) => (
                    <li
                        key={idx}
                        className={MessageLevel[message.level].toLowerCase()}
                    >
                        {message.timestamp} - {message.level}: {message.content}
                    </li>
                ))}
            </ul>
        </>
    )
}
