// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal

import { getArr0 } from 'renderer/utils'
import { ScriptInput, ScriptItemBase } from 'shared/types'
import { CustomField } from './CustomField'
import { SingleFileInput } from './SingleFileInput'
import { MultiFileInput } from './MultiFileInput'
import { MultiUriInput } from './MultiUriInput'
import { findInputType } from 'shared/utils'

const { App } = window

let isBatchableInput = (item: ScriptItemBase) => {
    return item.kind === 'input' && (item as ScriptInput).batchable
}

// item.mediaType is a file type e.g. application/x-dtbook+xml
export function formFieldFactory(
    item: ScriptItemBase,
    idprefix: string,
    onChange: (value: any, item: ScriptItemBase) => void,
    initialValue: any,
    error: string = undefined
) {
    let controlId = idprefix
    let allowFile = item.type == 'anyFileURI' || item.type == 'anyURI'
    let allowFolder = item.type == 'anyDirURI'
    let inputType = findInputType(item.type)
    if (inputType == 'file') {
        if (item.sequence || isBatchableInput(item)) {
            return (
                <MultiFileInput
                    elemId={controlId}
                    allowFile={allowFile}
                    allowFolder={allowFolder}
                    initialValue={initialValue}
                    mediaType={item.mediaType}
                    required={item.required}
                    onChange={(paths) => onChange(paths, item)}
                    canSort={!isBatchableInput(item)}
                />
            )
        } else {
            if (
                item.mediaType.includes(
                    'application/vnd.pipeline.tts-config+xml'
                )
            ) {
                return '' // this parameter is handled globally
            } else {
                // single file input is a button with a text display field (no text entry)
                return (
                    <SingleFileInput
                        elemId={controlId}
                        allowFile={allowFile}
                        allowFolder={allowFolder}
                        mediaType={item.mediaType}
                        required={item.required}
                        onChange={(path) => onChange(path, item)}
                        initialValue={getArr0(initialValue)}
                    />
                )
            }
        }
    } else if (inputType == 'checkbox') {
        return (
            <input
                type={inputType}
                required={item.required}
                onChange={(e) => onChange(e.target.checked, item)}
                id={controlId}
                checked={initialValue === 'true' || initialValue === true}
                aria-invalid={error ? 'true' : 'false'}
                aria-errormessage={controlId + '-error'}
                aria-labelledby={`${controlId}-label`}
            ></input>
        )
    } else if (['nonNegativeInteger', 'float', 'number'].includes(inputType)) {
        return (
            <input
                type="number"
                min={inputType == 'nonNegativeInteger' ? 0 : 'any'}
                step={inputType == 'float' ? 0.01 : 1}
                required={item.required}
                onChange={(e) => onChange(e.target.value, item)}
                id={controlId}
                value={initialValue}
                aria-labelledby={`${controlId}-label`}
            ></input>
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
    } else if (inputType == 'uri') {
        return (
            <MultiUriInput
                elemId={controlId}
                allowFile={allowFile}
                allowFolder={false}
                initialValue={initialValue}
                mediaType={item.mediaType}
                required={item.required}
                onChange={(paths) => onChange(paths, item)}
            />
        )
    } else {
        return (
            <input
                type="text"
                required={item.required}
                value={initialValue ?? ''}
                id={controlId}
                onChange={(e) => onChange(e.target.value, item)}
                aria-invalid={error ? 'true' : 'false'}
                aria-errormessage={controlId + '-error'}
                aria-labelledby={`${controlId}-label`}
            />
        )
    }
}
