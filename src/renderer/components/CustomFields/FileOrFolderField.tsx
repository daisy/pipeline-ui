import { useState } from 'react'
import { mediaTypesFileFilters } from 'shared/constants'
import styles from './styles.module.sass'

const { App } = window

// create a file or folder selector
// we can't use HTML <input type="file" ...> because even with the folder option enabled by "webkitdirectory"
// it won't let users select an empty folder
// and we can't reuse <input type="file" ...> even as a control to trigger electron's native file picker
// because you can't set the value on the input field programmatically (yes we could use loads of react code to work around this but let's not)
// so this function provides a button to browse and a text display of the path
export function FileOrFolderField(props: {
    item: {
        type: 'anyFileURI' | 'anyDirURI'
        name: string
        nicename: string
        desc: string
        mediaType: string
        required: boolean
        kind: string
        useSystemPath?: boolean
    }
    handleSelection?: (filename: string) => void
    selectedValue?: string
}) {
    let handleInputClick = async (e, item) => {
        e.preventDefault()
        // is it a file, folder, or either?
        let properties =
            item.type == 'anyFileURI'
                ? ['openFile']
                : item.type == 'anyDirURI'
                ? ['openDirectory']
                : ['openFile', 'openDirectory']
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
            asFileURL: !item.useSystemPath,
        })
        //e.target.nextElementSibling.textContent = filename
        filename && props.handleSelection && props.handleSelection(filename)
    }
    // all items that make it to this function have type of 'anyFileURI' or 'anyDirURI'`
    return (
        <div className={styles.FileOrFolderField}>
            <label htmlFor={`button-${props.item.name}`}>
                {props.item.nicename}
            </label>
            <span className={styles.description}>{props.item.desc}</span>
            <div className="fileOrFolderField">
                <button
                    type="button"
                    id={`button-${props.item.name}`}
                    data-required={props.item.required}
                    data-kind={props.item.kind}
                    onClick={(e) => handleInputClick(e, props.item)}
                >
                    {props.selectedValue ?? 'Browse'}
                </button>
                <span tabIndex={0} id={`text-${props.item.name}`}></span>
            </div>
        </div>
    )
}
