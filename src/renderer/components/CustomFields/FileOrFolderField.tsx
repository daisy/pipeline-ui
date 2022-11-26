import { useState } from 'react'
import { mediaTypesFileFilters } from 'shared/constants'

const { App } = window

// create a file or folder selector
// we can't use HTML <input type="file" ...> because even with the folder option enabled by "webkitdirectory"
// it won't let users select an empty folder
// and we can't reuse <input type="file" ...> even as a control to trigger electron's native file picker
// because you can't set the value on the input field programmatically (yes we could use loads of react code to work around this but let's not)
// so this function provides a button to browse and a text display of the path
export function FileOrFolderField({
    dialogProperties,
    elemId,
    mediaType,
    onSelect,
    name = null,
    type = 'open',
    buttonLabel = 'Browse', // what the button is called that you click to bring up a file dialog
    useSystemPath = false,
    defaultValue = '',
}: {
    dialogProperties: string[] // electron dialog properties for open or save, depending on which one you're doing (see 'type')
    elemId: string // ID for the control widget
    mediaType: string[] // array of mimetypes
    defaultValue?: string
    onSelect: (filename: string) => void // callback function
    name?: string // display name for the thing we're picking
    type: 'open' | 'save' // 'open' or 'save' are a little different in electron
    // save supports the 'createDirectory' property for macos
    buttonLabel?: string // the label for the control (not the label on the dialog)
    useSystemPath?: boolean // i forget what this is for but it defaults to 'true' and everywhere seems to set it to 'false'
}) {
    const [filename, setFilename] = useState('')

    let updateFilename = (filename) => {
        setFilename(filename)
        if (onSelect) {
            onSelect(filename)
        }
    }

    let onClick = async (e, name) => {
        e.preventDefault()

        let filters = getFiletypeFilters(mediaType)
        let filename
        let options = {
            title: `Select ${name ?? ''}`,
            defaultPath: filename ?? defaultValue,
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
        updateFilename(e.target.value)
    }

    // all items that make it to this function have type of 'anyFileURI' or 'anyDirURI'`
    return (
        <div className="file-or-folder">
            <input
                type="text"
                tabIndex={0}
                className="filename"
                value={filename ?? defaultValue}
                onChange={onTextInput}
            ></input>
            <button type="button" onClick={(e) => onClick(e, name)} id={elemId}>
                {buttonLabel}
            </button>
        </div>
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
