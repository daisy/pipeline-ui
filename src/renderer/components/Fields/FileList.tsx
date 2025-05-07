import { useState } from 'react'
import { Down, Up, X } from '../SvgIcons'
import { File, FileAsType } from './File'

// a list of files with a browse button
const FileList = ({ onChange, files, canSort, showAsType }) => {
    const moveFile = (fromIndex: number, toIndex: number) => {
        const updatedFiles = [...files]
        const [movedFile] = updatedFiles.splice(fromIndex, 1)
        updatedFiles.splice(toIndex, 0, movedFile)
        onChange?.(updatedFiles)
    }
    const removeFile = (index: number) => {
        const updatedFiles = [...files]
        updatedFiles.splice(index, 1)
        onChange?.(updatedFiles)
    }
    return (
        <>
            {!files.length && <p>No files</p>}
            {files.length > 0 && (
                <ul>
                    {files.map((file, index) => (
                        <li key={index}>
                            <File
                                showAsType={showAsType}
                                fileUrlOrPath={file}
                            />
                            <button
                                type="button"
                                className="remove-button"
                                onClick={() => removeFile(index)}
                                aria-label={`Remove file ${index + 1}`}
                            >
                                <X width="30" height="30" />
                            </button>
                            {canSort && index > 0 && (
                                <button
                                    type="button"
                                    className="move-button"
                                    onClick={() => moveFile(index, index - 1)}
                                    aria-label={`Move file ${index + 1} up`}
                                >
                                    <Up width="30" height="30" />
                                </button>
                            )}
                            {canSort && index < files.length - 1 && (
                                <button
                                    type="button"
                                    className="move-button"
                                    onClick={() => moveFile(index, index + 1)}
                                    aria-label={`Move file ${index + 1} down`}
                                >
                                    <Down width="30" height="30" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}

export { FileList }
