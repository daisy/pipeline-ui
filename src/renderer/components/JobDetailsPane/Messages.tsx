import { useState, useEffect } from 'react'
import { Job, Message, MessageLevel, JobStatus } from 'shared/types'
const { App } = window

let messageSort = (a, b) => (a.sequence < b.sequence ? b : a)

function MessageDisplay(m: Message, key, depth, verbose) {
    // show messages that pass the verbosity filter
    // always show error and warning
    let renderMessageChildren = (messages) => (
        <>
            {messages.map((msg, idx) =>
                MessageDisplay(msg, `${key}-${idx}`, depth + 1, verbose)
            )}
        </>
    )

    return (
        <>
            {verbose || m.level == 'ERROR' || m.level == 'WARNING' ? (
                <li key={key} className={MessageLevel[m.level].toLowerCase()}>
                    {m.level == 'INFO'
                        ? m.content
                        : `${m.level} - ${m.content}`}
                    {verbose && m.messages && m.messages.length ? (
                        <ul>{renderMessageChildren(m.messages)}</ul>
                    ) : (
                        ''
                    )}
                </li>
            ) : (
                ''
            )}
            {!verbose && m.messages && m.messages.length
                ? renderMessageChildren(m.messages)
                : ''}
        </>
    )
}

export function Messages({ job }: { job: Job }) {
    const [verbose, setVerbose] = useState(false)

    return (
        <>
            <div className="field row">
                <label htmlFor={`${job.internalId}-verbose`}>
                    View all messages
                </label>
                <input
                    id={`${job.internalId}-verbose`}
                    type="checkbox"
                    //@ts-ignore
                    onClick={(e) => setVerbose(e.target.checked)}
                    defaultChecked={verbose}
                ></input>
            </div>
            <ul>
                {job.jobData.messages
                    ?.sort(messageSort)
                    .map((message: Message, idx) =>
                        MessageDisplay(
                            message,
                            `log-${job?.internalId}-${idx}`,
                            0,
                            verbose
                        )
                    )}
            </ul>
        </>
    )
}
