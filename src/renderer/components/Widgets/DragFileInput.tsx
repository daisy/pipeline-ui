import React, { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { FileInputProps } from './FileInput'
import { debug } from 'electron-log'
import { PLATFORM, ENVIRONMENT } from 'shared/constants'
const { App } = window

// a drag and drop/browse button
const DragFileInput: React.FC<FileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    enabled = true,
}) => {
    const [isDragging, setIsDragging] = useState(false)
    const dropzoneRef = useRef<HTMLDivElement>(null)

    const onBrowse = async (browseFiles = true, browseFolders = true) => {
        let dialogOptions = { properties: [], filters: [] }
        if (browseFiles) dialogOptions.properties.push('openFile')
        if (browseFolders) dialogOptions.properties.push('openDirectory')
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

    let isMac = PLATFORM.IS_MAC

    return (
        <div className="drop-target-container">
            <div
                ref={dropzoneRef}
                className="drop-target"
                data-dragging={isDragging}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                tabIndex={enabled ? 0 : -1}
                aria-disabled={!enabled}
                id={elemId}
            >
                <Upload size={32} />
                <p className="drop-target-text">
                    Drop files here
                </p>
            </div>
            <div className="buttons">
                {isMac ? (
                    <button
                        className="browse-button"
                        onClick={(e) => onBrowse(true, true)}
                    >
                        Browse Files and Folders
                    </button>
                ) : (
                    <>
                        <button
                            className="browse-button"
                            onClick={(e) => onBrowse(true, false)}
                        >
                            Browse Files
                        </button>
                        <button
                            className="browse-button"
                            onClick={(e) => onBrowse(false, true)}
                        >
                            Browse Folders
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export { DragFileInput }
