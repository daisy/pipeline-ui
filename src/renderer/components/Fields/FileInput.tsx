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
    enabled?: boolean
}

// a browse button
const FileInput: React.FC<FileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    allowFile = true,
    allowFolder = false,
    enabled = true,
}) => {
    const onBrowse = async () => {
        let dialogOptions = []
        if (allowFile) dialogOptions.push('openFile')
        if (allowFolder) dialogOptions.push('openDirectory')
        let filename = await App.showOpenFileDialog({
            //@ts-ignore
            dialogOptions,
            asFileURL: true,
        })
        console.log("FileInput", filename)
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
            Browse
        </button>
    )
}

export { FileInput }
export type { FileInputProps }
