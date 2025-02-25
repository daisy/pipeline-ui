import { useState } from 'react'

// a list of files with a browse button
const FileList = ({ onChange, files }) => {
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
                    <span>{file}</span>
                    <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove file ${index + 1}`}
                    >
                        x
                    </button>
                    {index > 0 && (
                        <button
                            type="button"
                            className="move-button"
                            onClick={() => moveFile(index, index - 1)}
                            aria-label={`Move file ${index + 1} up`}
                        >
                            ↑
                        </button>
                    )}
                    {index < files.length - 1 && (
                        <button
                            type="button"
                            className="move-button"
                            onClick={() => moveFile(index, index + 1)}
                            aria-label={`Move file ${index + 1} down`}
                        >
                            ↓
                        </button>
                    )}
                </li>
            ))}
        </ul>
    )
}

export { FileList }
