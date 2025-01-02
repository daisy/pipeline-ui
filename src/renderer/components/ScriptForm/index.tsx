/*
Fill out fields for a new job and submit it
*/
import { useEffect, useMemo, useRef, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { findValue, ID } from 'renderer/utils/utils'
import {
    removeJob,
    requestStylesheetParameters,
    restoreJob,
    runBatchJobs,
    runJob,
    updateJob,
} from 'shared/data/slices/pipeline'
import {
    Job,
    JobState,
    Script,
    ScriptInput,
    ScriptItemBase,
    ScriptOption,
} from 'shared/types'

import { FormField } from '../Fields/FormField'
import { JobRequestError } from './jobRequestError'
import { ScriptName } from './scriptName'
import {
    getAllOptional,
    getAllRequired,
    getBatchInput,
    getBatchInputValues,
    getPrimaryInput,
    hasBatchInput,
    supportsBatch,
    updateArrayValue,
} from 'shared/utils'
const { App } = window

export function ScriptForm({ job, script }: { job: Job; script: Script }) {
    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [canRunJob, setCanRunJob] = useState(false)
    const submitButtonRef = useRef(null)

    let required = getAllRequired(script)
    let optional = getAllOptional(script)
    const { settings } = useWindowStore()

    useMemo(() => {
        // menu item triggers this event to submit the form
        App.onScriptFormSubmit('submit-script-form', async () => {
            if (submitButtonRef && submitButtonRef.current) {
                submitButtonRef.current.click()
            }
        })
    }, [])

    useEffect(() => {
        setCanRunJob(settings.downloadFolder?.trim() != '')
    }, [settings.downloadFolder])

    useEffect(() => {
        setSubmitInProgress(job.state == JobState.SUBMITTING)
    }, [job.state])

    // for to-pef scripts
    // the job request must be splitted in two step
    // First only display the following parameters
    // - inputs,
    // - stylesheet,
    // - page-width
    // - page-height

    // Filter out the options that are to be defined in the first step of braille script
    const filteredOptions = [
        'stylesheet',
        'page-width',
        'page-height',
        'audio',
        'braille',
        'tts',
    ]
    const hiddenOptions = ['transform', 'stylesheet-parameters']
    if (job.is2StepsJob) {
        optional = optional.filter((item) =>
            filteredOptions.includes(item.name)
        )
    }

    // After requestStylesheetParameters, the engine will return a list of new
    // script options. Those are stored separatly in the job.stylesheetParameters
    // properties
    // When this property is set
    // 'optional' is what is displayed on screen as optional values. they could technically be job inputs, options, or stylesheet parameters
    // but the user input values aren't stored there, those go in the job request itself
    if (job.is2StepsJob && job.stylesheetParameters != null) {
        required = []
        optional = [
            ...getAllOptional(script)
                .filter((item) => !filteredOptions.includes(item.name))
                .filter((item) => !hiddenOptions.includes(item.name)),
        ]
        for (let item of job.stylesheetParameters) {
            const existingOption = optional.find(
                (o) =>
                    o.name === item.name &&
                    o.isStylesheetParameter == item.isStylesheetParameter
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
        let stylesheetParameterOptions = [
            ...job.jobRequest.stylesheetParameterOptions,
        ]

        if (item.mediaType?.includes('text/css')) {
            // the css filenames are already formatted by our file widget as 'file:///'...
            // so i don't think they need to be modified before getting sent to the engine
            // but this block is a placeholder just in case we have to change it
            // i haven't tested this on windows as of now
        }
        if (item.kind == 'input') {
            inputs = updateArrayValue(value, item, inputs)
        } else {
            if (item.isStylesheetParameter) {
                stylesheetParameterOptions = updateArrayValue(
                    value,
                    item,
                    stylesheetParameterOptions
                )
            } else {
                options = updateArrayValue(value, item, options)
            }
        }
        App.store.dispatch(
            updateJob({
                ...job,
                jobRequest: {
                    ...job.jobRequest,
                    inputs: [...inputs],
                    options: [...options],
                    stylesheetParameterOptions: [...stylesheetParameterOptions],
                },
                jobRequestError: undefined,
                errors: job.errors?.filter((e) => e.fieldName !== item.name),
            })
        )
    }

    // submit a job
    let onSubmit = async (e) => {
        e.preventDefault()
        if (job.is2StepsJob && job.stylesheetParameters == null) {
            /*  constraints on the stylesheet parameters :
                the /stylesheet-parameters call should not be made if
                - TTS is disabled (audio = false) on scripts dtbook-to-daisy3, dtbook-to-epub3 and zedai-to-epub3
                - Braille and TTS is disabled (braille = false and audio = false) on epub3-to-epub3
                Note : epub-to-daisy also has a "tts" option which might be renamed to "audio".
             */
            const hasAudio = job.jobRequest.options.find(
                (o) => o.name === 'audio' || o.name === 'tts'
            )
            const hasBraille = job.jobRequest.options.find(
                (o) => o.name === 'braille'
            )
            if (
                (hasAudio &&
                    (hasAudio.value === true || hasAudio.value !== 'false')) ||
                (hasBraille && hasBraille.value === true) ||
                job.script.id.endsWith('to-pef')
            ) {
                App.store.dispatch(requestStylesheetParameters(job))
            } else {
                App.store.dispatch(
                    updateJob({
                        ...job,
                        stylesheetParameters: [],
                    })
                )
            }
        } else {
            let options = [...job.jobRequest.options]
            if (job.is2StepsJob) {
                // format all the stylesheet parameter options as a string
                // and assign it to the 'stylesheet-parameters' option
                let stylesheetParametersOption =
                    job.jobRequest.stylesheetParameterOptions
                        .map((o) => `(${o.name}:"${CSS.escape(o.value)}")`)
                        .join('')
                options = updateArrayValue(
                    stylesheetParametersOption,
                    script.options.find(
                        (o) =>
                            o.name == 'stylesheet-parameters' &&
                            !o.isStylesheetParameter
                    ),
                    job.jobRequest.options
                )
            }
            // TODO replace with API call
            // // autofill tts config option if present
            // // if present, it will be an input to the script but an optional one

            // let ttsConfigOpt = optional.find((o) =>
            //     o.mediaType?.includes('application/vnd.pipeline.tts-config+xml')
            // )

            // let ttsConfigExists = await App.pathExists(
            //     settings.ttsConfig.xmlFilepath
            // )
            // let inputs = [...job.jobRequest.inputs]
            // if (ttsConfigOpt && ttsConfigExists) {
            //     inputs = updateArrayValue(
            //         settings.ttsConfig.xmlFilepath,
            //         ttsConfigOpt,
            //         inputs
            //     )
            // } else if (!ttsConfigExists) {
            //     App.log(`File does not exist ${settings.ttsConfig.xmlFilepath}`)
            // }
            setSubmitInProgress(true)

            if (hasBatchInput(job)) {
                let batchInput = getBatchInput(job.script)
                console.log('has batch input')
                let batchJobRequestInputValues = getBatchInputValues(job)
                if (batchJobRequestInputValues?.length > 1) {
                    // run batch job
                    App.store.dispatch(
                        runBatchJobs({
                            ...job,
                            jobRequest: {
                                ...job.jobRequest,
                                options: [...options],
                            },
                        })
                    )
                }
                // the script is batch-able but only has one input
                else {
                    let inputs_ = updateArrayValue(
                        batchJobRequestInputValues[0],
                        batchInput,
                        job.jobRequest.inputs
                    )
                    App.store.dispatch(
                        runJob({
                            ...job,
                            jobRequest: {
                                ...job.jobRequest,
                                inputs: [...inputs_],
                                options: [...options],
                            },
                        })
                    )
                }
            } else {
                console.log('no batch input')
                App.store.dispatch(
                    runJob({
                        ...job,
                        jobRequest: {
                            ...job.jobRequest,
                            options: [...options],
                        },
                    })
                )
            }
        }
    }

    return (
        <>
            <section
                className="header"
                aria-labelledby={`${ID(job.internalId)}-script-hd`}
            >
                <div>
                    <ScriptName
                        script={script}
                        headerId={`${ID(job.internalId)}-script-hd`}
                    />
                    {job.jobRequestError && (
                        <JobRequestError
                            jobRequestError={job.jobRequestError}
                        />
                    )}
                </div>
            </section>
            <form onSubmit={onSubmit} id={`${ID(job.internalId)}-form`}>
                <div className="form-sections">
                    {required.length > 0 && (
                        <section
                            className="required-fields"
                            aria-labelledby={`${ID(job.internalId)}-required`}
                        >
                            <h2 id={`${ID(job.internalId)}-required`}>
                                Required information
                            </h2>
                            <ul className="fields">
                                {required.map((item, idx) => {
                                    return (
                                        <li key={idx}>
                                            <FormField
                                                item={item}
                                                key={idx}
                                                idprefix={`${ID(
                                                    job.internalId
                                                )}-${item.name}`}
                                                onChange={saveValueInJobRequest}
                                                initialValue={findValue(
                                                    item.name,
                                                    item.kind,
                                                    job.jobRequest,
                                                    item.isStylesheetParameter
                                                )}
                                                error={
                                                    job.errors?.find(
                                                        (e) =>
                                                            e.fieldName ===
                                                            item.name
                                                    )?.error
                                                }
                                            />
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    )}
                    {optional.length > 0 ? (
                        <section
                            className="optional-fields"
                            aria-labelledby={`${ID(job.internalId)}-optional`}
                        >
                            <h2 id={`${ID(job.internalId)}-optional`}>
                                Options
                            </h2>
                            <ul className="fields">
                                {optional.map((item) =>
                                    item.mediaType?.includes(
                                        'application/vnd.pipeline.tts-config+xml'
                                    ) ? (
                                        '' // skip it, we don't need to provide a visual field for this option, it's set globally
                                    ) : (
                                        <li
                                            key={`${ID(job.internalId)}-${
                                                item.name
                                            }-${item.isStylesheetParameter}-li`}
                                        >
                                            <FormField
                                                item={item}
                                                key={`${ID(job.internalId)}-${
                                                    item.name
                                                }-${
                                                    item.isStylesheetParameter
                                                }-FormField`}
                                                idprefix={`${ID(
                                                    job.internalId
                                                )}-${item.name}-${
                                                    item.isStylesheetParameter
                                                }`}
                                                onChange={saveValueInJobRequest}
                                                initialValue={findValue(
                                                    item.name,
                                                    item.kind,
                                                    job.jobRequest,
                                                    item.isStylesheetParameter
                                                )}
                                                error={
                                                    job.errors?.find(
                                                        (e) =>
                                                            e.fieldName ===
                                                            item.name
                                                    )?.error
                                                }
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
                {!canRunJob && (
                    <div className="warnings">
                        <p className="warning">
                            Go under settings and choose a results folder
                            location before running the job.
                        </p>
                    </div>
                )}
                <div className="form-buttons">
                    {job.is2StepsJob && job.stylesheetParameters != null && (
                        <button className="run" onClick={previous}>
                            Back
                        </button>
                    )}
                    {job.is2StepsJob && job.stylesheetParameters == null ? (
                        <button
                            className="run"
                            type="submit"
                            ref={submitButtonRef}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            className="run"
                            type="submit"
                            disabled={!canRunJob || submitInProgress}
                            ref={submitButtonRef}
                        >
                            {submitInProgress ? 'Starting...' : 'Run'}
                        </button>
                    )}
                    <button
                        className="cancel"
                        type="reset"
                        onClick={(e) => {
                            App.store.dispatch(
                                job.linkedTo ? restoreJob(job) : removeJob(job)
                            )
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </>
    )
}
