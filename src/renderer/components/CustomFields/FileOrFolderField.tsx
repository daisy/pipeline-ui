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
    options,
    elemId,
    mediaType,
    name = null,
    buttonLabel = 'Browse',
    useSystemPath = false,
    onSelect = null,
}: {
    options: string[]
    elemId: string
    mediaType: string[]
    name?: string
    buttonLabel?: string
    useSystemPath?: boolean
    onSelect?: (filename: string) => void
}) {
    const [filename, setFilename] = useState('')

    let onClick = async (e, name) => {
        e.preventDefault()

        let filters = getFiletypeFilters(mediaType)

        let filename = await App.showOpenFileDialog({
            dialogOptions: {
                title: `Select ${name ?? ''}`,
                buttonLabel: 'Select',
                // @ts-ignore
                options,
                filters,
            },
            asFileURL: !useSystemPath,
        })
        setFilename(filename)
        if (onSelect) {
            onSelect(filename)
        }
    }
    // all items that make it to this function have type of 'anyFileURI' or 'anyDirURI'`
    return (
        <div className="file-or-folder">
            <span tabIndex={0} className="filename">
                {filename}
            </span>
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
