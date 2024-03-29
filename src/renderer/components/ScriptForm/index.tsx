/*
Fill out fields for a new job and submit it
*/
import { Job, Script } from 'shared/types'
import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import {
    findValue,
    getAllOptional,
    getAllRequired,
    ID,
} from 'renderer/utils/utils'
import { restoreJob, runJob } from 'shared/data/slices/pipeline'
import {
    addJob,
    removeJob,
    updateJob,
    newJob,
} from 'shared/data/slices/pipeline'

import { externalLinkClick } from 'renderer/utils/utils'
import { FormField } from '../Fields/FormField'

const { App } = window

// update the array and return a new copy of it
let updateArrayValue = (value, data, arr) => {
    let arr2 = arr.map((i) => (i.name == data.name ? { ...i, value } : i))
    return arr2
}

export function ScriptForm({ job, script }: { job: Job; script: Script }) {
    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [error, setError] = useState(false)

    let required = getAllRequired(script)
    let optional = getAllOptional(script)
    const { settings } = useWindowStore()

    let saveValueInJobRequest = (value, data) => {
        if (!job.jobRequest) {
            return
        }
        let inputs = [...job.jobRequest.inputs]
        let options = [...job.jobRequest.options]

        if (data.mediaType.includes('text/css')) {
            // the css filenames are already formatted by our file widget as 'file:///'...
            // so i don't think they need to be modified before getting sent to the engine
            // but this block is a placeholder just in case we have to change it
            // i haven't tested this on windows as of now
        }
        if (data.kind == 'input') {
            inputs = updateArrayValue(value, data, inputs)
        } else {
            options = updateArrayValue(value, data, options)
        }

        App.store.dispatch(
            updateJob({
                ...job,
                jobRequest: {
                    ...job.jobRequest,
                    inputs: [...inputs],
                    options: [...options],
                },
            })
        )
    }

    // submit a job
    let onSubmit = async (e) => {
        e.preventDefault()
        setSubmitInProgress(true)

        App.store.dispatch(
            runJob({
                ...job,
                jobRequest: job.jobRequest,
            })
        )
        setSubmitInProgress(false)
    }

    return (
        <>
            <section
                className="header"
                aria-labelledby={`${ID(job.internalId)}-script-hd`}
            >
                <div>
                    <h1 id={`${ID(job.internalId)}-script-hd`}>
                        {script?.nicename}
                    </h1>
                    <p>{script?.description}</p>
                    <p>
                        {script?.homepage ? (
                            <a
                                href={script.homepage}
                                onClick={(e) => externalLinkClick(e, App)}
                            >
                                Read the script documentation.
                            </a>
                        ) : (
                            ''
                        )}
                    </p>
                </div>
                {error && <p>Error</p>}
            </section>

            {!submitInProgress ? (
                <form onSubmit={onSubmit} id={`${ID(job.internalId)}-form`}>
                    <div className="form-sections">
                        <section
                            className="required-fields"
                            aria-labelledby={`${ID(job.internalId)}-required`}
                        >
                            <h2 id={`${ID(job.internalId)}-required`}>
                                Required information
                            </h2>
                            <ul className="fields">
                                {required.map((item, idx) => (
                                    <li key={idx}>
                                        <FormField
                                            item={item}
                                            key={idx}
                                            idprefix={`${ID(
                                                job.internalId
                                            )}-required`}
                                            onChange={saveValueInJobRequest}
                                            initialValue={findValue(
                                                item.name,
                                                item.kind,
                                                job.jobRequest
                                            )}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                        {optional.length > 0 ? (
                            <section
                                className="optional-fields"
                                aria-labelledby={`${ID(
                                    job.internalId
                                )}-optional`}
                            >
                                <h2 id={`${ID(job.internalId)}-optional`}>
                                    Options
                                </h2>
                                <ul className="fields">
                                    {optional.map((item, idx) =>
                                        item.mediaType.includes(
                                            'application/vnd.pipeline.tts-config+xml'
                                        ) ? (
                                            '' // skip it, we don't need to provide a visual field for this option, it's set globally
                                        ) : (
                                            <li key={idx}>
                                                {item.mediaType.includes(
                                                    'text/css'
                                                ) ? (
                                                    <FormField
                                                        item={{
                                                            ...item,
                                                            kind: 'anyFile',
                                                        }}
                                                        key={idx}
                                                        idprefix={`${ID(
                                                            job.internalId
                                                        )}-optional`}
                                                        onChange={
                                                            saveValueInJobRequest
                                                        }
                                                        initialValue={findValue(
                                                            item.name,
                                                            'anyFile',
                                                            job.jobRequest
                                                        )}
                                                    />
                                                ) : (
                                                    <FormField
                                                        item={item}
                                                        key={idx}
                                                        idprefix={`${ID(
                                                            job.internalId
                                                        )}-optional`}
                                                        onChange={
                                                            saveValueInJobRequest
                                                        }
                                                        initialValue={findValue(
                                                            item.name,
                                                            item.kind,
                                                            job.jobRequest
                                                        )}
                                                    />
                                                )}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </section>
                        ) : (
                            ''
                        )}
                    </div>
                    <div className="form-buttons">
                        <button className="run" type="submit">
                            Run
                        </button>
                        <button
                            className="cancel"
                            type="reset"
                            onClick={(e) => {
                                App.store.dispatch(
                                    job.linkedTo
                                        ? restoreJob(job)
                                        : removeJob(job)
                                )
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <p>Submitting...</p>
                    {error && <p>Error</p>}
                </>
            )}
        </>
    )
}
