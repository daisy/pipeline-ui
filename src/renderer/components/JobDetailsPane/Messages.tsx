import { useState, useEffect } from 'react'
import { Job, Message, MessageLevel, JobStatus } from 'shared/types'
const { App } = window

let messageSort = (a, b) => (a.sequence < b.sequence ? b : a)

function MessageDisplay(m: Message, key, depth, verbose, showWarnings) {
    console.log('verbose', verbose)
    // show messages that pass the verbosity filter
    // always show error and warning
    let renderMessageChildren = (messages) => (
        <>
            {messages.map((msg, idx) =>
                MessageDisplay(
                    msg,
                    `${key}-${idx}`,
                    depth + 1,
                    verbose,
                    showWarnings
                )
            )}
        </>
    )

    return (
        <>
            {verbose ||
            (!verbose && depth < 2) ||
            m.level == 'ERROR' ||
            (showWarnings && m.level == 'WARNING') ? (
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
    const [showWarnings, setShowWarnings] = useState(true)

    useEffect(() => {})
    return (
        <>
            <div className="messageFilters">
                <div>
                    <label htmlFor={`${job.internalId}-showwarnings`}>
                        Show warnings
                    </label>
                    {verbose ? (
                        <input
                            id={`${job.internalId}-showwarnings`}
                            disabled
                            type="checkbox"
                            checked
                        ></input>
                    ) : (
                        <input
                            id={`${job.internalId}-showwarnings`}
                            type="checkbox"
                            //@ts-ignore
                            onClick={(e) => setShowWarnings(e.target.checked)}
                            defaultChecked={verbose || showWarnings}
                        ></input>
                    )}
                </div>
                <div>
                    <label htmlFor={`${job.internalId}-verbose`}>Verbose</label>
                    <input
                        id={`${job.internalId}-verbose`}
                        type="checkbox"
                        onClick={(e) => {
                            //@ts-ignore
                            setVerbose(e.target.checked)
                        }}
                        defaultChecked={verbose}
                    ></input>
                </div>
            </div>
            <ul>
                {job.jobData.messages
                    ?.sort(messageSort)
                    .map((message: Message, idx) =>
                        MessageDisplay(
                            message,
                            `log-${job?.internalId}-${idx}`,
                            0,
                            verbose,
                            showWarnings
                        )
                    )}
            </ul>
        </>
    )
}
