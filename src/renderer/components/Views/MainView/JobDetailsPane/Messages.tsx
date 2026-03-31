import { useState } from 'react'
import { Job, Message, MessageLevel } from 'shared/types'

let messageSort = (a, b) => a.sequence - b.sequence
function MessageDisplay(m: Message, key, depth, verbose) {
    let renderMessageChildren = (messages) => (
        <>
            {messages.map((msg, idx) =>
                MessageDisplay(msg, `${key}-${idx}`, depth + 1, verbose)
            )}
        </>
    )

    // show messages that pass the verbosity filter
    // always show error and warning
    return (
        <>
            {verbose || m.level == 'ERROR' || m.level == 'WARNING' ? (
                <li
                    key={key}
                    className={'msg-' + MessageLevel[m.level].toLowerCase()}
                >
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
                    Show errors and warnings only
                </label>
                <input
                    id={`${job.internalId}-verbose`}
                    type="checkbox"
                    checked={!verbose}
                    onChange={(e) => setVerbose(!e.target.checked)}
                ></input>
            </div>
            <ul>
                {job.jobData.messages
                    ?.slice()
                    .sort(messageSort)
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
