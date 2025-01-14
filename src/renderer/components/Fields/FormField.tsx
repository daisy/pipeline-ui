// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal

import { useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { externalLinkClick, findInputType } from 'renderer/utils'
import { ScriptItemBase } from 'shared/types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileOrFolderInput } from './FileOrFolderInput'
import { CustomField } from './CustomField'
import { MultiFileOrFolderInput } from './MultiFileOrFolderInput'

const { App } = window

// item.mediaType is a file type e.g. application/x-dtbook+xml
export function FormField({
    item,
    idprefix,
    onChange,
    initialValue,
    error = undefined,
}: {
    item: ScriptItemBase
    idprefix: string
    onChange: (value: any, item: ScriptItemBase) => void // function to set the value in a parent-level collection.
    initialValue: any // the initial value for the field
    error?: string // error message to display
}) {
    const [checked, setChecked] = useState(true)
    let controlId = `${idprefix}`
    let dialogOpts = ['anyFileURI', 'anyURI'].includes(item.type)
        ? ['openFile']
        : item.type == 'anyDirURI'
        ? ['openDirectory']
        : ['openFile', 'openDirectory']

    const { settings } = useWindowStore()
    let matchType = (item) => {
        let inputType = findInputType(item.type)
        if (inputType == 'file') {
            if (item.sequence) {
                return (
                    <MultiFileOrFolderInput
                        type="open"
                        dialogProperties={dialogOpts}
                        elemId={controlId}
                        mediaType={item.mediaType}
                        name={item.name}
                        onChange={(filenames) => onChange(filenames, item)}
                        useSystemPath={false}
                        buttonLabel="Browse"
                        required={item.required}
                        initialValue={initialValue}
                        ordered={item.ordered}
                        error={error}
                    />
                )
            } else {
                if (
                    item.mediaType.includes(
                        'application/vnd.pipeline.tts-config+xml'
                    )
                ) {
                    return '' // this case is handled in ScriptForm
                } else {
                    return (
                        <FileOrFolderInput
                            type="open"
                            dialogProperties={dialogOpts}
                            elemId={controlId}
                            mediaType={item.mediaType}
                            name={item.name}
                            onChange={(filename) => onChange(filename, item)}
                            useSystemPath={false}
                            buttonLabel="Browse"
                            required={item.required}
                            initialValue={initialValue}
                            error={error}
                        />
                    )
                }
            }
        } else if (inputType == 'checkbox') {
            return (
                <>
                    <input
                        type={inputType}
                        required={item.required}
                        onChange={(e) => onChange(e.target.checked, item)}
                        id={controlId}
                        checked={
                            initialValue === 'true' || initialValue === true
                        }
                        aria-invalid={error ? 'true' : 'false'}
                        aria-errormessage={controlId + '-error'}
                    ></input>
                    {error && (
                        <span
                            id={controlId + '-error'}
                            className="field-errors"
                            aria-live="polite"
                        >
                            {error}
                        </span>
                    )}
                </>
            )
        } else if (
            ['nonNegativeInteger', 'float', 'number'].includes(inputType)
        ) {
            return (
                <>
                    <input
                        type="number"
                        min={inputType == 'nonNegativeInteger' ? 1 : 'any'}
                        step={inputType == 'float' ? 0.01 : 1}
                        required={item.required}
                        onChange={(e) => onChange(e.target.value, item)}
                        id={controlId}
                        defaultValue={initialValue}
                    ></input>
                    {error && (
                        <span
                            id={controlId + '-error'}
                            className="field-errors"
                            aria-live="polite"
                        >
                            {error}
                        </span>
                    )}
                </>
            )
        } else if (inputType == 'custom') {
            return (
                <CustomField
                    item={item}
                    onChange={(newValue) => onChange(newValue, item)}
                    initialValue={initialValue ?? ''}
                    controlId={controlId}
                />
            )
        } else {
            return (
                <>
                    <input
                        type={inputType}
                        required={item.required}
                        value={initialValue ?? ''}
                        id={controlId}
                        onChange={(e) => onChange(e.target.value, item)}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-errormessage={controlId + '-error'}
                    ></input>
                    {error && (
                        <span
                            id={controlId + '-error'}
                            className="field-errors"
                            aria-live="polite"
                        >
                            {error}
                        </span>
                    )}
                </>
            )
        }
    }
    return (
        <div className="form-field">
            {item.desc ? (
                <details>
                    <summary>
                        {item.sequence ? (
                            <label id={`${controlId}-label`}>
                                {item.nicename}
                            </label>
                        ) : (
                            <label htmlFor={controlId}>{item.nicename}</label>
                        )}
                    </summary>

                    <div className="description">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: (props) => {
                                    return (
                                        <a
                                            href={props.href}
                                            onClick={(e) => {
                                                externalLinkClick(e, App)
                                            }}
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
            ) : item.sequence ? (
                <label id={`${controlId}-label`}>{item.nicename}</label>
            ) : (
                <label htmlFor={controlId}>{item.nicename}</label>
            )}
            {matchType(item)}
        </div>
    )
}
