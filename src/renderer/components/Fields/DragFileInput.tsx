import React, { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { FileInputProps } from './FileInput'
const { App } = window

// a drag and drop/browse button
const DragFileInput: React.FC<FileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    allowFile = true,
    allowFolder = true,
    enabled = true,
}) => {
    const [isDragging, setIsDragging] = useState(false)
    const dropzoneRef = useRef<HTMLDivElement>(null)

    const onBrowse = async () => {
        let dialogOptions = []
        if (allowFile) dialogOptions.push('openFile')
        if (allowFolder) dialogOptions.push('openDirectory')
        let filename = await App.showOpenFileDialog({
            //@ts-ignore
            dialogOptions,
            asFileURL: true,
        })
        // TODO support multiple filenames from the file picker
        if (filename) {
            onChange?.([filename])
        }
    }

    const onDragEnter = (e) => {
        if (!enabled) return
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const onDragLeave = (e) => {
        if (!enabled) return
        e.preventDefault()
        e.stopPropagation()

        if (e.target === dropzoneRef.current) {
            setIsDragging(false)
        }
    }

    const onDragOver = (e) => {
        if (!enabled) return
        e.preventDefault()
        e.stopPropagation()
    }

    const onDrop = async (e) => {
        if (!enabled) return
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const newItems: string[] = Array.from(e.dataTransfer.files)
            .map((item) => App.getDroppedFilePath(item))
            .filter((item) => item !== null)

        onChange(newItems)
    }

    return (
        <div
            ref={dropzoneRef}
            className="drop-target"
            data-dragging={isDragging}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={onBrowse}
            onKeyDown={(e) => {
                if (e.key == 'Enter' || e.key == ' ') {
                    onBrowse()
                }
            }}
            role="button"
            tabIndex={enabled ? 0 : -1}
            aria-disabled={!enabled}
            id={elemId}
        >
            <Upload size={32} />
            <p className="drop-target-text">
                <span>
                    Drop files here or{' '}
                    <span className="browse-button">Browse</span>
                </span>
            </p>
        </div>
    )
}

export { DragFileInput }
