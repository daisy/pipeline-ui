import { useState, useEffect } from 'react'
import { FileOrFolderInput } from './FileOrFolderInput'
import { Plus, Minus } from '../SvgIcons'

// this function provides a button to browse and a text display of the path
// we can't use the HTML input element (see this project's developer documentation for more info)
export function MultiFileOrFolderInput({
    dialogProperties,
    elemId,
    mediaType,
    onChange,
    name = null,
    type = 'open',
    buttonLabel = 'Browse', // what the button is called that you click to bring up a file dialog
    useSystemPath = false,
    required = false,
    ordered = false,
    initialValue = [''],
    error = undefined,
}: {
    dialogProperties: string[] // electron dialog properties for open or save, depending on which one you're doing (see 'type')
    elemId: string // ID for the control widget
    mediaType: string[] // array of mimetypes
    onChange: (filenames: Array<string>) => void // callback function
    initialValue?: Array<string> // the displayed value
    name?: string // display name for the thing we're picking
    type: 'open' | 'save' // 'open' or 'save' are a little different in electron
    // save supports the 'createDirectory' property for macos
    buttonLabel?: string // the label for the control (not the label on the dialog)
    useSystemPath?: boolean // i forget what this is for but it defaults to 'true' and everywhere seems to set it to 'false'
    required?: boolean
    ordered?: boolean
    error?: string // error message to display
}) {
    const [values, setValues] = useState<Array<string>>(initialValue || [''])

    useEffect(() => {
        values.forEach((v, idx) => {
            const elem = document.getElementById(
                `${elemId}-${idx}`
            ) as HTMLInputElement
            if (elem) {
                elem.setCustomValidity(error ?? '')
            }
        })
    }, [error])

    const errorProps = error
        ? {
              'aria-invalid': true,
              'aria-errormessage': elemId + '-error',
          }
        : {
              'aria-invalid': false,
          }

    let addValue = (value) => {
        let newValues = [...values]
        newValues.push(value)
        setValues(newValues)
    }
    let removeValue = (idx) => {
        let newValues = [...values]
        newValues.splice(idx, 1)
        setValues(newValues)
        onChange(newValues)
    }

    let onFileFolderChange = (filename, idx) => {
        let newValues = [...values]
        newValues[idx] = filename
        setValues(newValues)
        onChange(newValues)
    }
    return (
        <div key={elemId} {...errorProps}>
            {values.map((v, idx) => (
                <div className="multi-file-or-folder" key={idx}>
                    <div className="controls-row">
                        <FileOrFolderInput
                            type="open"
                            dialogProperties={dialogProperties}
                            elemId={`${elemId}-${idx}`}
                            mediaType={mediaType}
                            name={name}
                            onChange={(filename) =>
                                onFileFolderChange(filename, idx)
                            }
                            useSystemPath={false}
                            buttonLabel={buttonLabel}
                            required={required}
                            initialValue={values[idx]}
                            labelledBy={elemId + '-label'}
                        />
                        {values.length > 1 ? (
                            <button
                                type="button"
                                id={`remove-file-or-folder-${idx}`}
                                onClick={(e) => removeValue(idx)}
                                className="multi-file-or-folder"
                                title="Remove file"
                            >
                                <Minus width="12" height="12" />
                            </button>
                        ) : (
                            ''
                        )}
                        {idx == values.length - 1 ? (
                            <button
                                type="button"
                                id={`add-file-or-folder`}
                                onClick={(e) => addValue('')}
                                className="multi-file-or-folder"
                                title="Add file"
                            >
                                <Plus width="12" height="12" />
                            </button>
                        ) : (
                            ''
                        )}
                    </div>
                </div>
            ))}
            {error ? (
                <p
                    id={elemId + '-error'}
                    className="field-errors"
                    aria-live="polite"
                >
                    {error}
                </p>
            ) : (
                ''
            )}
        </div>
    )
}
