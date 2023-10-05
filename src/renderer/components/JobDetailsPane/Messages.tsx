import { Job, Message, MessageLevel, JobStatus } from 'shared/types'
const { App } = window

let messageSort = (a, b) => (a.sequence < b.sequence ? b : a)

function MessageDisplay(m: Message, key) {
    return (
        <li key={key} className={MessageLevel[m.level].toLowerCase()}>
            {m.level == 'INFO' ? m.content : `${m.level} - ${m.content}`}
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
        <ul aria-live="polite">
            {job.jobData.messages
                ?.sort(messageSort)
                .map((message: Message, idx) =>
                    MessageDisplay(message, `log-${job?.internalId}-${idx}`)
                )}
        </ul>
    )
}
