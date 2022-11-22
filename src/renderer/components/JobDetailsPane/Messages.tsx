import { MessageLevel } from 'shared/types'

let messageSort = (a, b) => (a.sequence < b.sequence ? b : a)

export function Messages({ job }) {
    return (
        <ul aria-live="polite">
            {job.jobData.messages?.sort(messageSort).map((message) => (
                <li className={MessageLevel[message.level].toLowerCase()}>
                    {message.timestamp} - {message.level}: {message.content}
                </li>
            ))}
        </ul>
    )
}
