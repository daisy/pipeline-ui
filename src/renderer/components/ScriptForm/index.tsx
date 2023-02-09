/*
Fill out fields for a new job and submit it
*/
import { Job, Script } from 'shared/types'
import { useState, useEffect } from 'react'
import {
    findValue,
    getAllOptional,
    getAllRequired,
    ID,
} from 'renderer/utils/utils'
import { Section } from '../Section'
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

export function ScriptForm({ job, script }: { job: Job; script: Script }) {
    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [error, setError] = useState(false)
    useEffect(() => {
        // For job edition, re-add previous value of the jobRequest if it exists
        const hasJobRequestOnScript: Boolean =
            job.jobRequest && job.jobRequest.scriptHref == script.href
        App.store.dispatch(
            updateJob({
                ...job,
                jobRequest: {
                    scriptHref: script.href,
                    nicename: script.nicename,
                    inputs: script.inputs.map((item, index) => {
                        return {
                            name: item.name,
                            value:
                                (hasJobRequestOnScript &&
                                    job.jobRequest.inputs[index].value) ||
                                null,
                            isFile:
                                item.type == 'anyFileURI' ||
                                item.type == 'anyDirURI',
                        }
                    }),
                    options: script.options.map((item, index) => {
                        return {
                            name: item.name,
                            value:
                                (hasJobRequestOnScript &&
                                    job.jobRequest.options[index].value) ||
                                item.default ||
                                null,
                            isFile:
                                item.type == 'anyFileURI' ||
                                item.type == 'anyDirURI',
                        }
                    }),
                },
            })
        )
    }, [script])

    let required = getAllRequired(script)
    let optional = getAllOptional(script)

    // take input from the form and add it to the job request
    let saveValueInJobRequest = (value, data) => {
        if (!job.jobRequest) {
            return
        }
        let inputs = [...job.jobRequest.inputs]
        let options = [...job.jobRequest.options]

        // update the array and return a new copy of it
        let updateValue = (value, data, arr) => {
            let arr2 = arr.map((i) =>
                i.name == data.name ? { ...i, value } : i
            )
            return arr2
        }
        if (data.kind == 'input') {
            inputs = updateValue(value, data, inputs)
        } else {
            options = updateValue(value, data, options)
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
    let onSubmit = (e) => {
        e.preventDefault()
        setSubmitInProgress(true)
        App.store.dispatch(
            runJob({
                ...job,
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
                    <p>
                        {script?.description}{' '}
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
                {error ? <p>Error</p> : ''}
            </section>

            {!submitInProgress ? (
                <form onSubmit={onSubmit} id={`${ID(job.internalId)}-form`}>
                    <div className="form-sections">
                        <Section
                            className="required-fields"
                            id={`${ID(job.internalId)}-required`}
                            label="Required information"
                        >
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
                        </Section>
                        {optional.length > 0 ? (
                            <Section
                                className="optional-fields"
                                id={`${ID(job.internalId)}-optional`}
                                label="Options"
                            >
                                <ul className="fields">
                                    {optional.map((item, idx) => (
                                        <li key={idx}>
                                            <FormField
                                                item={item}
                                                key={idx}
                                                idprefix={`${ID(
                                                    job.internalId
                                                )}-optional`}
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
                            </Section>
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
                    {error ? <p>Error</p> : ''}
                </>
            )}
        </>
    )
}

