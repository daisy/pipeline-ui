/*
Fill out fields for a new job and submit it
*/
import { jobRequestToXml, jobXmlToJson } from 'renderer/pipelineXmlConverter'
import { JobRequest, JobState, baseurl, Script } from 'shared/types'
import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { getAllOptional, getAllRequired, ID } from 'renderer/utils/utils'
import { Section } from '../Section'
import { marked } from 'marked'
import { FileOrFolderField } from '../CustomFields/FileOrFolderField'

export function ScriptForm({ job, scriptHref, updateJob }) {
    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [error, setError] = useState(false)
    const { pipeline, scripts } = useWindowStore()
    let script = scripts.find((s) => s.href == scriptHref)
    const [jobRequest, setJobRequest] = useState<JobRequest>({
        scriptHref: script.href,
        nicename: script.nicename,
        inputs: [],
        options: [],
    })

    let required = getAllRequired(script)
    let optional = getAllOptional(script)

    let setValue = (value, data) => {
        let inputs = [...jobRequest.inputs]
        let options = [...jobRequest.options]

        // update the array and return a new copy of it
        let updateValue = (value, data, arr) => {
            if (arr.find((i) => i.name == data.name)) {
                let arr2 = arr.map((i) =>
                    i.name == data.name ? { ...i, value, isFile } : i
                )
                return arr2
            } else {
                arr.push({
                    name: data.name,
                    value,
                    isFile,
                })
                return [...arr]
            }
        }
        let arr = data.kind == 'input' ? inputs : options
        arr = updateValue(value, data, arr)

        let isFile = data.type == 'anyFileURI' || data.type == 'anyDirURI'

        setJobRequest({ ...jobRequest, inputs, options })
    }

    // submit a job
    let onSubmit = async (e) => {
        setSubmitInProgress(true)

        console.log('jobreq', jobRequest)

        let xmlStr = jobRequestToXml(jobRequest)
        console.log(xmlStr)

        // this post request submits the job to the pipeline webservice
        let res = await fetch(`${baseurl(pipeline.runningWebservice)}/jobs`, {
            method: 'POST',
            body: xmlStr,
            mode: 'cors',
        })
        setSubmitInProgress(false)
        if (res.status != 201) {
            setError(true)
        } else {
            let newJobXml = await res.text()
            try {
                let newJobJson = jobXmlToJson(newJobXml)
                let job_ = {
                    ...job,
                    state: JobState.SUBMITTED,
                    jobData: newJobJson,
                    jobRequest,
                    script,
                }
                updateJob(job_)
            } catch (err) {
                setError(true)
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
                    <h1 id={`${ID(job.internalId)}-script-hd`}>
                        {script.nicename}
                    </h1>
                    <p>{script.description}</p>
                </div>
                <button
                    className="run"
                    type="submit"
                    onClick={(e) => onSubmit(e)}
                >
                    Run
                </button>
                {error ? <p>Error</p> : ''}
            </section>

            {!submitInProgress ? (
                <div className="flexgrid">
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
                                        setValue={setValue}
                                    />
                                </li>
                            ))}
                        </ul>
                    </Section>
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
                                        setValue={setValue}
                                    />
                                </li>
                            ))}
                        </ul>
                    </Section>
                </div>
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
function FormField({ item, idprefix, setValue }) {
    console.log('FORM FIELD', item)
    let inputType = 'text'

    if (item.type == 'anyFileURI') {
        inputType = 'file'
    } else if (item.type == 'anyDirURI') {
        inputType = 'file'
    } else if (item.type == 'xsd:dateTime' || item.type == 'datetime') {
        inputType = 'datetime-local'
    } else if (item.type == 'xsd:boolean' || item.type == 'boolean') {
        inputType = 'checkbox'
    } else if (item.type == 'xsd:string' || item.type == 'string') {
        inputType = 'text'
    } else if (
        [
            'xsd:integer',
            'xsd:float',
            'xsd:double',
            'xsd:decimal',
            'xs:integer',
            'integer',
            'number',
        ].includes(item.type)
    ) {
        inputType = 'number'
    } else {
        inputType = 'text'
    }

    let controlId = `${idprefix}-${item.name}`
    let desc = marked.parse(item.desc)
    let onFileFolderSelect = (filename, data) => {
        setValue(filename, data)
    }
    let onChange = (e, data) => {
        if (e.target.getAttribute('type') == 'checkbox') {
            setValue(e.checked, data)
        } else {
            setValue(e.value, data)
        }
    }
    let dialogOpts =
        item.type == 'anyFileURI'
            ? ['openFile']
            : item.type == 'anyDirURI'
            ? ['openFolder']
            : ['openFile', 'openFolder']

    return (
        <div className="script-field">
            <label htmlFor={controlId}>{item.nicename}</label>
            <span
                className="description"
                dangerouslySetInnerHTML={{ __html: desc }}
            />
            {inputType == 'file' ? (
                <FileOrFolderField
                    options={dialogOpts}
                    elemId={controlId}
                    mediaType={item.mediaType}
                    name={item.name}
                    onSelect={(filename) => onFileFolderSelect(filename, item)}
                    useSystemPath={false}
                />
            ) : inputType == 'checkbox' ? (
                <input
                    type={inputType}
                    required={item.required}
                    onChange={(e) => onChange(e, item)}
                    // TODO add item default
                    id={controlId}
                ></input>
            ) : (
                <input
                    type={inputType}
                    required={item.required}
                    value={item.default}
                    id={controlId}
                    onChange={(e) => onChange(e, item)}
                ></input>
            )}
        </div>
    )
}
