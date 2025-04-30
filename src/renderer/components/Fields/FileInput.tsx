import React, { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { FileTreeEntry } from 'main/ipcs/fileSystem'
import { mediaTypesFileFilters } from 'shared/constants'
import { debug } from 'electron-log'

const { App } = window

interface FileInputProps {
    elemId: string
    mediaType?: string[]
    allowFile?: boolean
    allowFolder?: boolean
    allowMultiSelections?: boolean
    enabled?: boolean
    label?: string
    onChange?: (paths: string[]) => void
    initialValue?: string[]
    required?: boolean
}

// a browse button
const FileInput: React.FC<FileInputProps> = ({
    elemId,
    mediaType = ['*'],
    allowFile = true,
    allowFolder = false,
    enabled = true,
    label = 'Browse',
    onChange,
    initialValue = [],
    required = false,
}) => {
    const onBrowse = async () => {
        let dialogOptions = {properties: [], filters: []}
        if (allowFile) dialogOptions.properties.push('openFile')
        if (allowFolder) dialogOptions.properties.push('openDirectory')
        dialogOptions.filters = getFiletypeFilters(mediaType)

        let filenames = await App.showOpenFileDialog({
            //@ts-ignore
            dialogOptions,
        })
        if (filenames) {
            onChange?.(filenames)
        }
    }

    return (
        <button
            type="button"
            className="file-browse-button"
            onClick={onBrowse}
            id={elemId}
        >
            {label}
        </button>
    )
}
function getFiletypeFilters(mediaType) {
    let filters_ = mediaTypesFileFilters.filter((mt) => mediaType.includes(mt.type))
    // merge the values in the filters so that instead of
    // filters: [{name: 'EPUB', extensions: ['epub']}, {name: 'Package', extensions['opf']}]
    // we get
    // filters: [{name: "EPUB, Package", extensions: ['epub', 'opf']}]
    let filterNames = Array.from(new Set(filters_.map((f) => f.name))).join(', ')
    let filterExts = Array.from(new Set(filters_.map((f) => f.extensions).flat()))

    let filters = [{ name: filterNames, extensions: filterExts }]

    filters.push({name: "Any file", extensions: ["*"]})

    return filters
}

export { FileInput }
export type { FileInputProps }
