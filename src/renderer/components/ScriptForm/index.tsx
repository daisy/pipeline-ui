/*
Fill out fields for a new job and submit it
*/
import { jobRequestToXml, jobXmlToJson } from 'renderer/pipelineXmlConverter'
import { JobRequest, JobState, baseurl, Script } from 'shared/types'
import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { mediaTypesFileFilters } from 'shared/constants'
import { getAllOptional, getAllRequired, ID } from 'renderer/utils/utils'
import { Section } from '../Section'
import { marked } from 'marked'

const { App } = window // The "App" comes from the bridge

export function ScriptForm({ job, scriptHref, updateJob }) {
    const [submitInProgress, setSubmitInProgress] = useState(false)
    const [error, setError] = useState(false)

    const { pipeline, scripts } = useWindowStore()

    let script = scripts.find((s) => s.href == scriptHref)

    let required = getAllRequired(script)
    let optional = getAllOptional(script)

    // submit a job
    let onSubmit = async (e) => {
        setSubmitInProgress(true)
        let jobRequest: JobRequest = {
            scriptHref: script.href,
            nicename: script.nicename,
            inputs: [],
            options: [],
        }

        let { inputs, options } = getFormData(
            e.target.parentElement.parentElement
        )
        jobRequest.inputs = inputs
        jobRequest.options = options

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
function FormField({ item, idprefix }) {
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

    if (inputType == 'file') {
        return <FileOrFolderField item={item} idprefix={idprefix} />
    } else {
        let desc = marked.parse(item.desc)

        return (
            <div className="script-field">
                <label htmlFor={`${idprefix}-${item.name}`}>
                    {item.nicename}
                </label>
                <span
                    className="description"
                    dangerouslySetInnerHTML={{ __html: desc }}
                />
                {inputType == 'checkbox' ? (
                    <input
                        type={inputType}
                        required={item.required}
                        data-kind={item.kind}
                        data-name={item.name}
                        checked={item.default == 'true'}
                        id={`${idprefix}-${item.name}`}
                    ></input>
                ) : (
                    <input
                        type={inputType}
                        required={item.required}
                        data-kind={item.kind}
                        data-name={item.name}
                        value={item.default}
                        checked={item.default}
                        id={`${idprefix}-${item.name}`}
                    ></input>
                )}
            </div>
        )
    }
}

// create a file or folder selector
// we can't use HTML <input type="file" ...> because even with the folder option enabled by "webkitdirectory"
// it won't let users select an empty folder
// and we can't reuse <input type="file" ...> even as a control to trigger electron's native file picker
// because you can't set the value on the input field programmatically (yes we could use loads of react code to work around this but let's not)
// so this function provides a button to browse and a text display of the path
function FileOrFolderField({ item, idprefix }) {
    let onInputClick = async (e, item) => {
        e.preventDefault()
        // is it a file, folder, or either?
        let properties =
            item.type == 'anyFileURI'
                ? ['openFile']
                : item.type == 'anyDirURI'
                ? ['openFolder']
                : ['openFile', 'openFolder']
        // what file type(s)?
        let filters_ = Array.isArray(item.mediaType)
            ? item.mediaType
                  .filter((mediaType) =>
                      mediaTypesFileFilters.hasOwnProperty(mediaType)
                  )
                  .map((mediaType) => mediaTypesFileFilters[mediaType])
            : []

        // merge the values in the filters so that instead of
        // filters: [{name: 'EPUB', extensions: ['epub']}, {name: 'Package', extensions['opf']}]
        // we get
        // filters: [{name: "EPUB, Package", extensions: ['epub', 'opf']}]
        let filterNames = filters_.map((f) => f.name).join(', ')
        let filterExts = filters_.map((f) => f.extensions).flat()

        let filters = [{ name: filterNames, extensions: filterExts }]

        filters.push(mediaTypesFileFilters['*'])

        let filename = await App.showOpenFileDialog({
            title: `Select ${item.name}`,
            buttonLabel: 'Select',
            properties,
            filters,
        })
        e.target.parentElement.querySelector('span.filename').textContent =
            filename
    }
    let desc = marked.parse(item.desc)

    // all items that make it to this function have type of 'anyFileURI' or 'anyDirURI'`
    return (
        <div className="script-field">
            <label htmlFor={`${idprefix}-${item.name}`}>{item.nicename}</label>
            <span
                className="description"
                dangerouslySetInnerHTML={{ __html: desc }}
            />
            <div className="file-or-folder">
                <span tabIndex={0} className="filename" />
                <button
                    type="button"
                    data-required={item.required}
                    data-kind={item.kind}
                    data-name={item.name}
                    onClick={(e) => onInputClick(e, item)}
                    id={`${idprefix}-${item.name}`}
                >
                    Browse
                </button>
            </div>
        </div>
    )
}

// this is a very not-react way to do it
// but I would prefer not to be tied to react at every level
function getFormData(scriptFormElm) {
    let inputData = []
    let optionData = []

    if (!scriptFormElm) {
        console.log('Form error')
        return
    }
    let fields = scriptFormElm.querySelectorAll('.script-field')
    Array.from(fields).map((field: HTMLElement) => {
        let fileOrFolder = field.querySelector('.file-or-folder')
        if (fileOrFolder) {
            // look for the path in a span
            let path =
                fileOrFolder.querySelector('span.filename')?.textContent ?? ''
            let button = fileOrFolder.querySelector('button')
            let arr =
                button?.getAttribute('data-kind') == 'input'
                    ? inputData
                    : optionData
            arr.push({
                name: button?.getAttribute('data-name'),
                value: path,
                isFile: true,
            })
        } else {
            // handle the input element (used only for non-file options)
            let input = field.querySelector('input')
            let value = input?.type == 'checkbox' ? input?.value == 'on' : input?.value
            optionData.push({
                name: input?.getAttribute('data-name'),
                value,
                isFile: false,
            })
        }
    })
    // get the inner span with the value of the selected file or folder
    let fileOrFoldersElms = scriptFormElm.querySelectorAll('.file-or-folder')
    Array.from(fileOrFoldersElms)
        .map((elm: HTMLElement) => {
            let name = elm.querySelector('button')?.id.replace('button-', '')
            let kind = elm.querySelector('button').getAttribute('data-kind')
            let value = elm.querySelector('span')?.textContent ?? ''
            return { name, value, kind }
        })
        .map((data) => {
            let arr = data.kind == 'input' ? inputData : optionData
            arr.push({ name: data.name, value: data.value, isFile: true })
        })
    // TODO validate the fields

    return { inputs: inputData, options: optionData }
}
