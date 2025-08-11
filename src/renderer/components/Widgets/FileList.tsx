import { Down, Up, X } from './SvgIcons'
import { File } from './File'

// a list of files with a browse button
const FileList = ({ onChange, files, canSort, showAsType, required }) => {
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
            {!files.length && !required && (
                <p className="file-list no-files">No files</p>
            )}
            {!files.length && required && (
                <p className="file-list-no-files error">
                    At least one file is required
                </p>
            )}
            {files.length > 0 && (
                <ul className="file-list">
                    {files.map((file, index) => (
                        <li key={index}>
                            <File
                                showAsType={showAsType}
                                fileUrlOrPath={file}
                            />
                            {canSort && index > 0 && (
                                <button
                                    type="button"
                                    className="move-button invisible"
                                    onClick={() => moveFile(index, index - 1)}
                                    aria-label={`Move file ${index + 1} up`}
                                >
                                    <Up width="20" height="20" />
                                </button>
                            )}
                            {canSort && index < files.length - 1 && (
                                <button
                                    type="button"
                                    className="move-button invisible"
                                    onClick={() => moveFile(index, index + 1)}
                                    aria-label={`Move file ${index + 1} down`}
                                >
                                    <Down width="20" height="20" />
                                </button>
                            )}
                            <button
                                type="button"
                                className="remove-button invisible"
                                onClick={() => removeFile(index)}
                                aria-label={`Remove file ${index + 1}`}
                            >
                                <X width="20" height="20" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}

export { FileList }
