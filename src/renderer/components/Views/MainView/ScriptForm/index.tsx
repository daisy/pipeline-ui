/*
Fill out fields for a new job and submit it
*/
import { useEffect, useMemo, useRef, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { externalLinkClick, findValue, ID } from 'renderer/utils/utils'
import {
    requestStylesheetParameters,
    runBatchJobs,
    runJob,
    updateJob,
} from 'shared/data/slices/pipeline'
import { Job, JobState, ScriptItemBase, ScriptOption } from 'shared/types'

import { FormField } from '../../../Widgets/FormField'
import {
    getAllOptional,
    getAllRequired,
    getBatchInput,
    getBatchInputValues,
    hasBatchInput,
    updateArrayValue,
} from 'shared/utils'
import { CustomName } from '../../../Widgets/CustomName'
import { validateJobRequest } from 'renderer/utils/jobRequestValidator'
const { App } = window

export function ScriptForm({ job }: { job: Job }) {
    const { settings } = useWindowStore()

    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [hasDownloadFolder, setHasDownloadFolder] = useState(
        settings.downloadFolder?.trim() != ''
    )
    const [isValidJobRequest, setIsValidJobRequest] = useState(
        job.jobRequest.validation.find((v) => v.required && !v.validValue) ==
            undefined
    )

    const submitButtonRef = useRef(null)

    let required = getAllRequired(job.script)
    let optional = getAllOptional(job.script)

    useMemo(() => {
        // menu item triggers this event to submit the form
        App.onScriptFormSubmit('submit-script-form', async () => {
            if (submitButtonRef && submitButtonRef.current) {
                submitButtonRef.current.click()
            }
        })
    }, [])

    useEffect(() => {
        let validDownloadFolder = settings.downloadFolder?.trim() != ''
        setHasDownloadFolder(hasDownloadFolder && validDownloadFolder)
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
            ...getAllOptional(job.script)
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

    let saveValueInJobRequest = async (value: any, item: ScriptItemBase) => {
        if (!job.jobRequest) {
            return
        }
        console.log("save value in job request", value, item)
        let inputs = [...job.jobRequest.inputs]
        let options = [...job.jobRequest.options]
        let stylesheetParameterOptions = [
            ...job.jobRequest.stylesheetParameterOptions,
        ]
        // convert to URL format if it's a filepath
        let value_ = value
        if (['anyURI', 'anyFileURI'].includes(item.type)) {
            if (Array.isArray(value_)) {
                let tmp = []
                for (let v of value_) {
                    let retval = await App.pathToFileURL(v)
                    tmp.push(retval)
                }
                value_ = [...tmp]
            } else {
                value_ = await App.pathToFileURL(value)
            }
        }
        if (item.mediaType?.includes('text/css')) {
            // modify anything here before sending to engine
            // e.g. the filepath format
            // this block is a placeholder just in case we have to change it
        }
        if (item.kind == 'input') {
            inputs = updateArrayValue(value_, item, inputs)
        } else {
            if (item.isStylesheetParameter) {
                stylesheetParameterOptions = updateArrayValue(
                    value_,
                    item,
                    stylesheetParameterOptions
                )
            } else {
                options = updateArrayValue(value_, item, options)
            }
        }
        let modifiedJobRequest = {
            ...job.jobRequest,
            inputs: [...inputs],
            options: [...options],
            stylesheetParameterOptions: [...stylesheetParameterOptions],
        }
        let requestValidationResult = await validateJobRequest(
            modifiedJobRequest,
            job.script,
            App
        )
        console.log(requestValidationResult)
        modifiedJobRequest.validation = [...requestValidationResult]
        setIsValidJobRequest(
            modifiedJobRequest.validation.find(
                (v) => v.required && !v.validValue
            ) == undefined
        )
        App.store.dispatch(
            updateJob({
                ...job,
                jobRequest: modifiedJobRequest,
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
                    job.script.options.find(
                        (o) =>
                            o.name == 'stylesheet-parameters' &&
                            !o.isStylesheetParameter
                    ),
                    job.jobRequest.options
                )
            }

            setSubmitInProgress(true)

            if (hasBatchInput(job)) {
                let batchInput = getBatchInput(job.script)
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
                // so run it like a single-input job
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
                // the script is not batchable
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
        <form
            className="script"
            aria-label={`Script form for ${job.script.nicename}`}
            onSubmit={onSubmit}
        >
            <div className="script-description info">
                <p>
                    {job.script.description}
                    {job.script.inputs.find((i) =>
                        i.mediaType.includes(
                            'application/vnd.pipeline.tts-config+xml'
                        )
                    ) && '. Text can be recorded in TTS voices.'}{' '}
                    {job.script.homepage && (
                        <a
                            href={job.script.homepage}
                            onClick={(e) => externalLinkClick(e, App)}
                        >
                            Learn more.
                        </a>
                    )}
                </p>
                {job.script.batchable && (
                    <p className="tip">
                        Add multiple files to run a batch job.
                    </p>
                )}
            </div>

            {required.length > 0 && (
                <fieldset
                    aria-labelledby={`${ID(job.internalId)}-required`}
                    className="required"
                >
                    <legend>Input</legend>
                    {required.map((item, idx) => {
                        return (
                            <FormField
                                item={item}
                                key={idx}
                                idprefix={`${ID(job.internalId)}-${item.name}`}
                                onChange={saveValueInJobRequest}
                                initialValue={
                                    findValue(
                                        item.name,
                                        item.kind,
                                        job.jobRequest,
                                        item.isStylesheetParameter
                                    ) ?? []
                                }
                                error={
                                    job.errors?.find(
                                        (e) => e.fieldName === item.name
                                    )?.error
                                }
                            />
                        )
                    })}
                </fieldset>
            )}
            {optional.length > 0 && (
                <fieldset className="optional">
                    <legend>Options</legend>
                    {(!job.is2StepsJob ||
                        (job.is2StepsJob &&
                            job.stylesheetParameters == null)) && (
                        <CustomName job={job} />
                    )}
                    {optional.map((item) =>
                        item.mediaType?.includes(
                            'application/vnd.pipeline.tts-config+xml'
                        ) ? (
                            '' // skip it, we don't need to provide a visual field for this option, it's set globally
                        ) : (
                            <FormField
                                item={item}
                                key={`${ID(job.internalId)}-${item.name}-${
                                    item.isStylesheetParameter
                                }-FormField`}
                                idprefix={`${ID(job.internalId)}-${item.name}-${
                                    item.isStylesheetParameter
                                }`}
                                onChange={saveValueInJobRequest}
                                initialValue={
                                    findValue(
                                        item.name,
                                        item.kind,
                                        job.jobRequest,
                                        item.isStylesheetParameter
                                    ) ?? []
                                }
                                error={
                                    job.errors?.find(
                                        (e) => e.fieldName === item.name
                                    )?.error
                                }
                            />
                        )
                    )}
                </fieldset>
            )}
            {!hasDownloadFolder && settings.downloadFolder?.trim() == '' && (
                <div className="warnings">
                    <p className="warning">
                        Go under settings and choose a results folder location
                        before running the job.
                    </p>
                </div>
            )}
            <div className="controls">
                {job.is2StepsJob && job.stylesheetParameters != null && (
                    <button
                        className="important"
                        onClick={previous}
                        type="button"
                    >
                        Back
                    </button>
                )}
                {job.is2StepsJob && job.stylesheetParameters == null ? (
                    <button
                        className="important"
                        type="submit"
                        ref={submitButtonRef}
                    >
                        Next
                    </button>
                ) : (
                    <button
                        className="important"
                        type="submit"
                        disabled={
                            !hasDownloadFolder ||
                            !isValidJobRequest ||
                            submitInProgress
                        }
                        ref={submitButtonRef}
                    >
                        Run
                    </button>
                )}
            </div>
        </form>
    )
}
/*

{/* <section
                className="header"
                aria-labelledby={`${ID(job.internalId)}-script-hd`}
            >
                
                <ScriptName
                    script={job.script}
                    headerId={`${ID(job.internalId)}-script-hd`}
                />
                
                {job.jobRequestError && (
                    <JobRequestError jobRequestError={job.jobRequestError} />
                )}*/
