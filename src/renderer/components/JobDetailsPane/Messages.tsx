import { Job, Message, MessageLevel, JobStatus } from 'shared/types'
const { App } = window

let messageSort = (a, b) => (a.sequence < b.sequence ? b : a)
let handleWebLink = (e) => {
    e.preventDefault()
    App.openInBrowser(e.target.href)
}

function MessageDisplay(m: Message, key) {
    return (
        <li key={key} className={MessageLevel[m.level].toLowerCase()}>
            {/* {m.timestamp} - {m.level}:  */}
            {m.level} - {m.content}
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
    console.log(job.jobData)
    let probableLogLink = job?.jobData?.href ? `${job.jobData.href}/log` : ''

    return (
        <>
            {job?.jobData?.log ? (
                <p>
                    <a href={job.jobData.log} onClick={handleWebLink}>
                        View detailed log
                    </a>
                </p>
            ) : job?.jobData?.status == JobStatus.ERROR && probableLogLink ? (
                <a href={probableLogLink} onClick={handleWebLink}>View detailed log</a>
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
