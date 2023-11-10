/*
Fill out fields for a new job and submit it
*/
import { Job, Script } from 'shared/types'
import { useState, useEffect } from 'react'
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
import log from 'electron-log/renderer'

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

    useEffect(() => {
        // if this script has a TTS config field, fill it in with the value from the user's settings
        // as xml files, tts config files are inputs though they are typically optional
        let ttsConfigOpt = optional.find((o) =>
            o.mediaType.includes('application/vnd.pipeline.tts-config+xml')
        )

        if (ttsConfigOpt) {
            let inputs = [...job.jobRequest.inputs]
            let inputs_ = updateArrayValue(
                settings.ttsConfig.xmlFilepath,
                ttsConfigOpt,
                inputs
            )
            log.info(
                `Setting TTS config option ${JSON.stringify(
                    ttsConfigOpt,
                    null,
                    '  '
                )} in job inputs ${JSON.stringify(inputs_, null, '  ')}`
            )

            App.store.dispatch(
                updateJob({
                    ...job,
                    jobRequest: {
                        ...job.jobRequest,
                        inputs: [...inputs_],
                    },
                })
            )
        }
    }, [])

    let saveValueInJobRequest = (value, data) => {
        if (!job.jobRequest) {
            return
        }
        let inputs = [...job.jobRequest.inputs]
        let options = [...job.jobRequest.options]

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
                                            '' // skip it, we don't need to provide a visual field for this option, it's set in the settings
                                        ) : (
                                            <li key={idx}>
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
