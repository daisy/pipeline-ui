// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal

import { useState } from 'react'
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
}: {
    item: ScriptItemBase
    idprefix: string
    onChange: (string, ScriptItemBase) => void // function to set the value in a parent-level collection.
    initialValue: any // the initial value for the field
}) {
    const [value, setValue] = useState(initialValue)
    let controlId = `${idprefix}-${item.name}`

    let onChangeValue = (newValue, scriptItem) => {
        setValue(newValue)
        onChange(newValue, scriptItem)
    }
    let dialogOpts =
        item.type == 'anyFileURI'
            ? ['openFile']
            : item.type == 'anyDirURI'
            ? ['openDirectory']
            : ['openFile', 'openDirectory']

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
                        onChange={(filenames) => onChangeValue(filenames, item)}
                        useSystemPath={false}
                        buttonLabel="Browse"
                        required={item.required}
                        initialValue={initialValue}
                        ordered={item.ordered}
                    />
                )
            } else {
                // TODO is it an array or a string
                if (
                    item.mediaType ==
                        'application/vnd.pipeline.tts-config+xml' ||
                    item.mediaType.includes(
                        'application/vnd.pipeline.tts-config+xml'
                    )
                ) {
                    // this parameter comes from a global setting
                    // TODO what is it going to be
                    initialValue = "ttsConfig.xml"
                }
                return (
                    <FileOrFolderInput
                        type="open"
                        dialogProperties={dialogOpts}
                        elemId={controlId}
                        mediaType={item.mediaType}
                        name={item.name}
                        onChange={(filename) =>
                            onChangeValue(filename, item)
                        }
                        useSystemPath={false}
                        buttonLabel="Browse"
                        required={item.required}
                        initialValue={initialValue}
                    />
                )
            }
        } else if (inputType == 'checkbox') {
            return (
                <>
                    <input
                        type={inputType}
                        required={item.required}
                        onChange={(e) => onChangeValue(e.target.checked, item)}
                        id={controlId}
                        checked={value === 'true' || value === true}
                    ></input>
                </>
            )
        } else if (inputType == 'custom') {
            return (
                <CustomField
                    item={item}
                    onChange={(newValue) => onChangeValue(newValue, item)}
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
                        // @ts-ignore
                        value={initialValue ?? ''}
                        id={controlId}
                        onChange={(e) => onChangeValue(e.target.value, item)}
                    ></input>
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
                        {item.mediaType.includes('application/vnd.pipeline.tts-config+xml') ? 'Modify the global TTS configuration via Pipeline Settings, or choose your own file:' : ''}
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
