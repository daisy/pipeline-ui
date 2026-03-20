import { useEffect, useState } from 'react'
import { Job, Message, MessageLevel } from 'shared/types'

let messageSort = (a, b) => a.sequence - b.sequence

export function Messages({ job }: { job: Job }) {
    const [verbose, setVerbose] = useState(false)
    const [messages, setMessages] = useState(
        structuredClone(job.jobData.messages).flat(Infinity).sort(messageSort)
    )
    useEffect(() => {
        setMessages(
            structuredClone(job.jobData.messages)
                .flat(Infinity)
                .sort(messageSort)
        )
    }, [job.jobData.messages])

    return (
        <>
            <div className="field row">
                <label htmlFor={`${job.internalId}-verbose`}>
                    Show errors and warnings only
                </label>
                <input
                    id={`${job.internalId}-verbose`}
                    type="checkbox"
                    //@ts-ignore
                    onClick={(e) => setVerbose(!e.target.checked)}
                    defaultChecked={!verbose}
                ></input>
            </div>
            <ul>
                {messages
                    .filter(
                        (message) =>
                            verbose ||
                            message.level == 'ERROR' ||
                            message.level == 'WARNING'
                    )
                    .map((message: Message, idx) => (
                        <li
                            key={`log-${job?.internalId}-${idx}`}
                            className={
                                'msg-' +
                                MessageLevel[message.level].toLowerCase()
                            }
                        >
                            {message.level == 'INFO'
                                ? message.content
                                : `${message.level} - ${message.content}`}
                        </li>
                    ))}
            </ul>
        </>
    )
}
