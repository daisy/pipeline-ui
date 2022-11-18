import { jobRequestToXml, jobXmlToJson } from 'renderer/pipelineXmlConverter'
import { JobRequest, JobState, baseurl } from 'shared/types'
import styles from './styles.module.sass'
import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { mediaTypesFileFilters } from 'shared/constants'

const { App } = window // The "App" comes from the bridge

export function ScriptForm({ job, scriptHref, removeJob, updateJob }) {
    // IS_FORM, IS_SUBMITTING, IS_ERROR
    const [formStatus, setFormStatus] = useState('IS_FORM')
    const { pipeline, scripts } = useWindowStore()

    let script = scripts.find((s) => s.href == scriptHref)

    // keep it simple for now by only showing required inputs and options
    let requiredInputs = script.inputs
        .filter((input) => input.required)
        // inputs are always files (vs options)
        .map((input) => ({ ...input, type: 'anyFileURI', kind: 'input' }))

    let requiredOptions = script.options
        .filter((option) => option.required)
        .map((option) => ({ ...option, kind: 'option' }))
    let allRequired = [...requiredInputs, ...requiredOptions]

    // submit a job
    let handleOnSubmit = async (e) => {
        setFormStatus('IS_SUBMITTING')
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

        let xmlStr = jobRequestToXml(jobRequest)

        // test that our XML parses
        // let doc = new DOMParser().parseFromString(xmlStr, 'text/xml')
        // console.log(doc.getElementsByTagName('jobRequest')[0].nodeName)

        // this post request submits the job to the pipeline webservice
        let res = await fetch(`${baseurl(pipeline.runningWebservice)}/jobs`, {
            method: 'POST',
            body: xmlStr,
            mode: 'cors',
        })

        if (res.status != 201) {
            setFormStatus('IS_ERROR')
        } else {
            let newJobXml = await res.text()
            try {
                setFormStatus('SUBMITTED')
                let newJobJson = jobXmlToJson(newJobXml)
                let job_ = {
                    ...job,
                    state: JobState.SUBMITTED,
                    jobData: newJobJson,
                }
                updateJob(job_.internalId, job_)
            } catch (err) {
                setFormStatus('IS_ERROR')
            }
        }
    }

    return (
        <div className={styles.ScriptForm}>
            <h3>{script.nicename}</h3>

            {formStatus == 'IS_FORM' ? (
                <>
                    <p>Required fields:</p>
                    <ul>
                        {allRequired.map((item, idx) => (
                            <li key={idx}>
                                <FormField item={item} key={idx} />
                            </li>
                        ))}
                    </ul>
                    <div className={styles.SubmitCancel}>
                        <button onClick={(e) => removeJob(job.internalId)}>
                            Cancel new job
                        </button>
                        <button
                            id="run-script"
                            type="submit"
                            onClick={(e) => handleOnSubmit(e)}
                        >
                            Run
                        </button>
                    </div>
                </>
            ) : formStatus == 'IS_SUBMITTING' ? (
                <p>Submitting...</p>
            ) : formStatus == 'IS_ERROR' ? (
                <p>Error</p>
            ) : formStatus == 'SUBMITTED' ? (
                <p>Submitted</p>
            ) : (
                ''
            )}
        </div>
    )
}

// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal
// item.mediaType is a file type e.g. application/x-dtbook+xml
function FormField({ item }) {
    let inputType = 'text'

    if (item.type == 'anyFileURI') {
        inputType = 'file'
    } else if (item.type == 'anyDirURI') {
        inputType = 'file'
    } else if (item.type == 'xsd:dateTime') {
        inputType = 'datetime-local'
    } else if (item.type == 'xsd:boolean') {
        inputType = 'checkbox'
    } else if (item.type == 'xsd:string') {
        inputType = 'text'
    }
    // catch-all for
    // item.type == xsd:integer, xsd:float, xsd:double, xsd:decimal
    // we can fine tune this later
    else {
        inputType = 'number'
    }

    if (inputType == 'file') {
        return <FileOrFolderField item={item} />
    } else {
        return (
            <div>
                <label htmlFor={item.name}>{item.nicename}</label>
                <span className={styles.description}>{item.desc}</span>
                <input
                    type={inputType}
                    id={item.name}
                    required={item.required}
                    data-kind={item.kind}
                ></input>
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
function FileOrFolderField({ item }) {
    let handleInputClick = async (e, item) => {
        e.preventDefault()
        // is it a file, folder, or either?
        let properties =
            item.type == 'anyFileURI'
                ? ['openFile']
                : item.type == 'anyDirURI'
                ? ['openFolder']
                : ['openFile', 'openFolder']
        // what file type(s)?
        console.log('media type', item.mediaType)
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
            dialogOptions: {
                title: `Select ${item.name}`,
                buttonLabel: 'Select',
                properties,
                filters,
            },
        })
        e.target.nextElementSibling.textContent = filename
    }
    // all items that make it to this function have type of 'anyFileURI' or 'anyDirURI'`
    return (
        <div className={styles.FileOrFolderField}>
            <label htmlFor={`button-${item.name}`}>{item.nicename}</label>
            <span className={styles.description}>{item.desc}</span>
            <div className="fileOrFolderField">
                <button
                    type="button"
                    id={`button-${item.name}`}
                    data-required={item.required}
                    data-kind={item.kind}
                    onClick={(e) => handleInputClick(e, item)}
                >
                    Browse
                </button>
                <span tabIndex={0} id={`text-${item.name}`}></span>
            </div>
        </div>
    )
}

// return all the inputs and options in the form
function getFormData(scriptFormElm) {
    let inputData = []
    let optionData = []

    if (!scriptFormElm) {
        console.log('Form error')
        return
    }
    let inputs = scriptFormElm.querySelectorAll('input')
    Array.from(inputs).map((input: HTMLInputElement) => {
        if (input.getAttribute('data-kind') == 'input') {
            inputData.push({
                name: input.id,
                value: input.value,
                isFile: false,
            })
        }
        if (input.getAttribute('data-kind') == 'option') {
            optionData.push({
                name: input.id,
                value: input.value,
                isFile: false,
            })
        }
    })
    // get the inner span with the value of the selected file or folder
    let fileOrFoldersElms = scriptFormElm.querySelectorAll('.fileOrFolderField')
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
