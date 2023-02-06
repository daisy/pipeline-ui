/*
Fill out fields for a new job and submit it
*/
import {
    jobRequestToXml,
    jobXmlToJson,
} from 'shared/parser/pipelineXmlConverter'
import { JobRequest, JobState, baseurl, ScriptItemBase } from 'shared/types'
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import {
    findInputType,
    findValue,
    getAllOptional,
    getAllRequired,
    ID,
} from 'renderer/utils/utils'
import { Section } from '../Section'
import { marked } from 'marked'
import { FileOrFolderInput } from '../CustomFields/FileOrFolderInput'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { runJob } from 'shared/data/slices/pipeline'
import {
    addJob,
    removeJob,
    updateJob,
    newJob,
} from 'shared/data/slices/pipeline'

const { App } = window

export function ScriptForm({ job, script }) {
    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [error, setError] = useState(false)
    useEffect(() => {
        let updatedJob = {
            ...job,
            jobRequest: {
                scriptHref: script.href,
                nicename: script.nicename,
                inputs: script.inputs.map((item) => ({
                    name: item.name,
                    value: null,
                    isFile:
                        item.type == 'anyFileURI' || item.type == 'anyDirURI',
                })),
                options: script.options.map((item) => ({
                    name: item.name,
                    value: item.default ? item.default : null,
                    isFile:
                        item.type == 'anyFileURI' || item.type == 'anyDirURI',
                })),
            },
        }
        App.store.dispatch(updateJob(updatedJob))
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
                    <p>{script?.description}</p>
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
                                App.store.dispatch(removeJob(job))
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

// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal
// item.mediaType is a file type e.g. application/x-dtbook+xml
function FormField({
    item,
    idprefix,
    onChange,
    initialValue,
}: {
    item: ScriptItemBase
    idprefix: string
    onChange: (string, ScriptItemBase) => void // function to set the value in a parent-level collection.
    initialValue: any // the initialValue
}) {
    let inputType = findInputType(item.type)
    const [value, setValue] = useState(initialValue)
    let controlId = `${idprefix}-${item.name}`

    let onFileFolderChange = (filename, data) => {
        console.log('onFileFolderChange', filename)
        onChange(filename, data)
    }
    let onInputChange = (e, data) => {
        let newValue =
            e.target.getAttribute('type') == 'checkbox'
                ? e.target.checked
                : e.target.value
        setValue(newValue)
        onChange(newValue, data)
    }
    let dialogOpts =
        item.type == 'anyFileURI'
            ? ['openFile']
            : item.type == 'anyDirURI'
            ? ['openDirectory']
            : ['openFile', 'openDirectory']

    let externalLinkClick = (e) => {
        e.preventDefault()
        App.openInBrowser(e.target.href)
    }

    return (
        <div className="form-field">
            <details>
                <summary>
                    <label htmlFor={controlId}>{item.nicename}</label>
                </summary>

                <div className="description">
                    <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: (props) => {
                                return (
                                    <a
                                        href={props.href}
                                        onClick={externalLinkClick}
                                    >
                                        {props.children}
                                    </a>
                                )
                            },
                        }}
                    >
                        {item.desc}
                    </Markdown>
                </div>
            </details>

            {inputType == 'file' ? ( // 'item' may be an input or an option
                <FileOrFolderInput
                    type="open"
                    dialogProperties={dialogOpts}
                    elemId={controlId}
                    mediaType={item.mediaType}
                    name={item.name}
                    onChange={(filename) => onFileFolderChange(filename, item)}
                    useSystemPath={false}
                    buttonLabel="Browse"
                    required={item.required}
                    initialValue={initialValue}
                />
            ) : inputType == 'checkbox' ? ( // 'item' is an option
                <input
                    type={inputType}
                    required={item.required}
                    onChange={(e) => onInputChange(e, item)}
                    id={controlId}
                    checked={value === 'true' || value === true}
                ></input>
            ) : (
                // 'item' is an option
                <input
                    type={inputType}
                    required={item.required}
                    // @ts-ignore
                    value={initialValue ?? ''}
                    id={controlId}
                    onChange={(e) => onInputChange(e, item)}
                ></input>
            )}
        </div>
    )
}
