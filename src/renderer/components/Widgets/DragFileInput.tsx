import React, { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { FileInputProps } from './FileInput'
import { debug } from 'electron-log'
const { App } = window

// a drag and drop/browse button
const DragFileInput: React.FC<FileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    allowFile = true,
    allowFolder = true,
    allowMultiSelections = true,
    enabled = true,
}) => {
    const [isDragging, setIsDragging] = useState(false)
    const dropzoneRef = useRef<HTMLDivElement>(null)

    const onBrowse = async () => {
        let dialogOptions = { properties: [], filters: [] }
        if (allowFile) dialogOptions.properties.push('openFile')
        if (allowFolder) dialogOptions.properties.push('openDirectory')
        if (allowMultiSelections)
            dialogOptions.properties.push('multiSelections')

        let filenames = await App.showOpenFileDialog({
            //@ts-ignore
            dialogOptions,
        })

        if (filenames) {
            onChange?.(filenames)
            debug('DragFileInput onBrowse', filenames)
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
        let newItems: string[] = []
        for (let item of Array.from(e.dataTransfer.files)) {
            let retval = await App.getDroppedFilePath(item)
            if (retval) {
                newItems.push(retval)
            }
        }
        onChange(newItems)
        debug('DragFileInput onBrowse', newItems)
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
