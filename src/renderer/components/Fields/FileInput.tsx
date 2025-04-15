import React, { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { FileTreeEntry } from 'main/ipcs/fileSystem'

const { App } = window

interface FileInputProps {
    elemId: string
    mediaType?: string[]
    onChange?: (paths: string[]) => void
    allowFile?: boolean
    allowFolder?: boolean
    allowMultiSelections?: boolean
    enabled?: boolean
    label?: string
}

// a browse button
const FileInput: React.FC<FileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    allowFile = true,
    allowFolder = false,
    enabled = true,
    label = 'Browse',
}) => {
    const onBrowse = async () => {
        let dialogOptions = []
        if (allowFile) dialogOptions.push('openFile')
        if (allowFolder) dialogOptions.push('openDirectory')
        
        let filename = await App.showOpenFileDialog({
            //@ts-ignore
            properties: dialogOptions,
            asFileURL: true,
        })
        
        if (filename) {
            onChange?.([filename])
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

export { FileInput }
export type { FileInputProps }
