import { useState, useEffect } from 'react'
import { mediaTypesFileFilters } from 'shared/constants'
import { Datatype } from 'shared/types'

const { App } = window

// this function provides a button to browse and a text display of the path
// we can't use the HTML input element (see this project's developer documentation for more info)
export function FileOrFolderInput({
    dialogProperties,
    elemId,
    mediaType,
    onChange,
    name = null,
    type = 'open',
    buttonLabel = 'Browse', // what the button is called that you click to bring up a file dialog
    useSystemPath = false,
    required = false,
    initialValue = '',
    labelledBy = '',
    enabled = true,
    error = undefined,
}: {
    dialogProperties: string[] // electron dialog properties for open or save, depending on which one you're doing (see 'type')
    elemId: string // ID for the control widget
    mediaType: string[] // array of mimetypes
    onChange: (filename: string) => void // callback function
    initialValue?: string // the displayed value
    name?: string // display name for the thing we're picking
    type: 'open' | 'save' // 'open' or 'save' are a little different in electron
    // save supports the 'createDirectory' property for macos
    buttonLabel?: string // the label for the control (not the label on the dialog)
    useSystemPath?: boolean // i forget what this is for but it defaults to 'true' and everywhere seems to set it to 'false'
    required?: boolean
    //makeSlotForErrors?: boolean // create a span for error messages; if false, it is assumed that this will appear elsewhere
    labelledBy?: string // id of the label for this element, if present use aria-labelledby, if absent, assume the label will have an htmlFor on it
    enabled?: boolean // should the control be given the 'grayedout' classname
    error?: string // error message to display
}) {
    // the value is stored internally as it can be set 2 ways
    // and also broadcast via onChange so that a parent component can subscribe
    const [value, setValue] = useState(initialValue)
    const [userInteracted, setUserInteracted] = useState(false) // false if the user started typing
    useEffect(() => {
        const elem = document.getElementById(elemId) as HTMLInputElement
        if (elem) {
            elem.setCustomValidity(error ?? '')
        }
    }, [error])

    let updateFilename = (filename) => {
        //console.log("new filename", filename)
        setValue(filename)
        onChange && onChange(filename)
    }

    let onClick = async (e, name) => {
        e.preventDefault()
        let filters = getFiletypeFilters(mediaType)
        let filename = ''
        let options = {
            title: `Select ${name ?? ''}`,
            defaultPath: value?.replace('file://', '') ?? '',
            buttonLabel: 'Select', // this is a different buttonLabel, it's the one for the actual file browse dialog
            filters,
            // @ts-ignore
            properties: dialogProperties,
        }
        if (type == 'open') {
            filename = await App.showOpenFileDialog({
                //@ts-ignore
                dialogOptions: options,
                asFileURL: !useSystemPath,
            })
        } else if (type == 'save') {
            filename = await App.showSaveDialog({
                // @ts-ignore
                dialogOptions: options,
                asFileURL: !useSystemPath,
            })
        }
        updateFilename(filename)
    }

    let onTextInput = (e) => {
        setUserInteracted(true)
        updateFilename(e.target.value)
    }

    // all items that make it to this function have type of 'anyFileURI' or 'anyDirURI'`
    const errorProps = error
        ? {
              'aria-invalid': true,
              'aria-errormessage': elemId + '-error',
          }
        : {
              'aria-invalid': false,
          }
    return (
        <>
            <div className="file-or-folder">
                <div className="controls-row">
                    <input
                        type="text"
                        tabIndex={0}
                        className={`filename ${
                            userInteracted ? 'interacted' : ''
                        } ${enabled ? '' : 'grayedout'}`}
                        value={value ?? ''}
                        onChange={(e) => onTextInput(e)}
                        id={elemId}
                        required={required}
                        aria-labelledby={labelledBy ?? ''}
                        disabled={!enabled}
                        {...errorProps}
                    ></input>
                    <button
                        type="button"
                        onClick={(e) => onClick(e, name)}
                        disabled={!enabled}
                        className={enabled ? '' : 'grayedout'}
                    >
                        {buttonLabel}
                    </button>
                </div>
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
        </>
    )
}

function getFiletypeFilters(mediaType) {
    let filters_ = Array.isArray(mediaType)
        ? mediaType
              .filter((mt) => mediaTypesFileFilters.hasOwnProperty(mt))
              .map((mt) => mediaTypesFileFilters[mt])
        : []

    // merge the values in the filters so that instead of
    // filters: [{name: 'EPUB', extensions: ['epub']}, {name: 'Package', extensions['opf']}]
    // we get
    // filters: [{name: "EPUB, Package", extensions: ['epub', 'opf']}]
    let filterNames = filters_.map((f) => f.name).join(', ')
    let filterExts = filters_.map((f) => f.extensions).flat()

    let filters = [{ name: filterNames, extensions: filterExts }]

    filters.push(mediaTypesFileFilters['*'])

    return filters
}
