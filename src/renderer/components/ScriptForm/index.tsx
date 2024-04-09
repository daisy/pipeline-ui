/*
Fill out fields for a new job and submit it
*/
import {
    Job,
    NameValue,
    Script,
    ScriptItemBase,
    ScriptOption,
} from 'shared/types'
import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import {
    findValue,
    getAllOptional,
    getAllRequired,
    ID,
} from 'renderer/utils/utils'
import {
    requestStylesheetParameters,
    restoreJob,
    runJob,
} from 'shared/data/slices/pipeline'
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
let updateArrayValue = (value: any, data: ScriptItemBase, arr: NameValue[]) => {
    let arr2 = arr.map((i) => (i.name == data.name ? { ...i, value } : i))
    return arr2
}

export function ScriptForm({ job, script }: { job: Job; script: Script }) {
    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [error, setError] = useState(false)

    let required = getAllRequired(script)
    let optional = getAllOptional(script)
    const { settings } = useWindowStore()

    // for to-pef scripts
    // the job request must be splitted in two step
    // First only display the following parameters
    // - inputs,
    // - stylesheet,
    // - page-width
    // - page-height

    // Cannot use const isBrailleJob = optional.findIndex((item) => item.name === 'stylesheet')
    // as other non braille steps have a stylesheet option
    const isBrailleJob = (script && script.id.endsWith('to-pef')) || false
    // Filter out the options that are to be defined in the first step of braille script
    const filteredOptions = ['stylesheet', 'page-width', 'page-height']
    const hiddenOptions = ['transform', 'stylesheet-parameters']
    if (isBrailleJob) {
        optional = optional.filter((item) =>
            filteredOptions.includes(item.name)
        )
    }

    // After requestStylesheetParameters, the engine will return a list of new
    // script options. Those are stored separatly in the job.stylesheetParameters
    // properties
    // When this property is set
    if (isBrailleJob && job.stylesheetParameters != null) {
        required = []
        optional = [
            ...getAllOptional(script)
                .filter((item) => !filteredOptions.includes(item.name))
                .filter((item) => !hiddenOptions.includes(item.name)),
        ]
        for (let item of job.stylesheetParameters) {
            const existingOption = optional.find(
                (o) => o.name === item.name
            ) as ScriptOption | undefined
            if (existingOption !== undefined) {
                existingOption.default = item.default
            } else {
                optional.push(item)
            }
        }
    }

    // Allow the user to go back to first inputs and options set
    let previous = async (e) => {
        e.preventDefault()
        App.store.dispatch(
            updateJob({
                ...job,
                stylesheetParameters: null,
            })
        )
    }

    let saveValueInJobRequest = (value: any, item: ScriptItemBase) => {
        if (!job.jobRequest) {
            return
        }
        let inputs = [...job.jobRequest.inputs]
        let options = [...job.jobRequest.options]

        if (item.mediaType?.includes('text/css')) {
            // the css filenames are already formatted by our file widget as 'file:///'...
            // so i don't think they need to be modified before getting sent to the engine
            // but this block is a placeholder just in case we have to change it
            // i haven't tested this on windows as of now
        }
        if (item.kind == 'input') {
            inputs = updateArrayValue(value, item, inputs)
        } else {
            options = updateArrayValue(value, item, options)
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
        if (isBrailleJob && job.stylesheetParameters == null) {
            App.store.dispatch(requestStylesheetParameters(job))
        } else {
            setSubmitInProgress(true)
            App.store.dispatch(
                runJob({
                    ...job,
                    jobRequest: job.jobRequest,
                })
            )
            setSubmitInProgress(false)
        }
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
                        {required.length > 0 && (
                            <section
                                className="required-fields"
                                aria-labelledby={`${ID(
                                    job.internalId
                                )}-required`}
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
                        )}
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
                                        item.mediaType?.includes(
                                            'application/vnd.pipeline.tts-config+xml'
                                        ) ? (
                                            '' // skip it, we don't need to provide a visual field for this option, it's set globally
                                        ) : (
                                            <li
                                                key={`${ID(job.internalId)}-${
                                                    item.name
                                                }-li`}
                                            >
                                                <FormField
                                                    item={item}
                                                    key={`${ID(
                                                        job.internalId
                                                    )}-${item.name}-FormField`}
                                                    idprefix={`${ID(
                                                        job.internalId
                                                    )}-${item.name}-optional`}
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
                        {isBrailleJob && job.stylesheetParameters != null && (
                            <button className="run" onClick={previous}>
                                Back
                            </button>
                        )}
                        {isBrailleJob && job.stylesheetParameters == null ? (
                            <button className="run" type="submit">
                                Next
                            </button>
                        ) : (
                            <button className="run" type="submit">
                                Run
                            </button>
                        )}
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
