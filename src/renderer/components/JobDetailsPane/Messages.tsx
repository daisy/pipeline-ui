import { Job, Message, MessageLevel } from 'shared/types'
const { App } = window

let messageSort = (a, b) => (a.sequence < b.sequence ? b : a)
let handleWebLink = (e) => {
    e.preventDefault()
    App.openInBrowser(e.target.href)
}

function MessageDisplay(m: Message, key) {
    return (
        <li key={key} className={MessageLevel[m.level].toLowerCase()}>
            {m.timestamp} - {m.level}: {m.content}
            {m.messages && m.messages.length > 0 && (
                <ul>
                    {m.messages.map((m, idx) =>
                        MessageDisplay(m, `${key}-${idx}`)
                    )}
                </ul>
            )}
        </li>
    )
}

export function Messages({ job }: { job: Job }) {
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
                {job.jobData.messages
                    ?.sort(messageSort)
                    .map((message: Message, idx) =>
                        MessageDisplay(message, `log-${job?.internalId}-${idx}`)
                    )}
            </ul>
        </>
    )
}
