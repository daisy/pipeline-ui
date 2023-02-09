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
    initialValue: any // the initialValue
}) {
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

    let matchType = (inputType) => {
        if (inputType == 'file') {
            return (
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
            )
        } else if (inputType == 'checkbox') {
            return (
                <input
                    type={inputType}
                    required={item.required}
                    onChange={(e) => onInputChange(e, item)}
                    id={controlId}
                    checked={value === 'true' || value === true}
                ></input>
            )
        } else if (inputType == 'custom') {
            return (
                <CustomField
                    item={item}
                    onChange={(e) => onInputChange(e, item)}
                    initialValue={initialValue ?? ''}
                    controlId={controlId}
                />
            )
        } else {
            return (
                <input
                    type={inputType}
                    required={item.required}
                    // @ts-ignore
                    value={initialValue ?? ''}
                    id={controlId}
                    onChange={(e) => onInputChange(e, item)}
                ></input>
            )
        }
    }
    return (
        <div className="form-field">
            {item.desc ? (
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
                                            onClick={(e) =>
                                                externalLinkClick(e, App)
                                            }
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
            ) : (
                <label htmlFor={controlId}>{item.nicename}</label>
            )}
            {matchType(findInputType(item.type))}
        </div>
    )
}