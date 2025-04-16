import { useState } from 'react'
import { Down, Up, X } from '../SvgIcons'

// a list of files with a browse button
const FileList = ({ onChange, files, canSort }) => {
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
        <ul>
            {files.map((file, index) => (
                <li key={index}>
                    <span>{file.replace('file:///', '/')}</span>
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
    )
}

export { FileList }
