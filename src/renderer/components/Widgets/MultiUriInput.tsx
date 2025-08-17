import { useState } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { FileList } from './FileList'
import { FileAsType } from './File'

interface MultiFileInputProps extends FileInputProps {
    initialValue?: string[]
    required?: boolean
}

// a list of files with a browse button
const MultiUriInput: React.FC<MultiFileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    allowFile = true,
    allowFolder = false,
    initialValue = [],
    showHint,
    enabled = true,
    required = false,
}) => {
    const [files, setFiles] = useState<string[]>(initialValue)
    const [text, setText] = useState<string>('')

    const addFiles = (newFiles: string[]) => {
        console.log(files, newFiles)
        // make list unique
        updateFiles(Array.from(new Set([...files, ...newFiles])))
    }
    let updateFiles = (changedFiles) => {
        setFiles(changedFiles)
        onChange?.(changedFiles)
    }
    return (
        <div className="multi-file-input multi-uri-input">
            <label htmlFor={`${elemId}-input`}>
                Browse for a file or enter a URI:
            </label>
            <div className="row controls">
                <div className="row">
                    <FileInput
                        elemId={elemId}
                        allowFile={allowFile}
                        allowFolder={allowFolder}
                        mediaType={mediaType}
                        onChange={(f) => {
                            if (f && f.length > 0) addFiles(f)
                        }}
                        label="Add file"
                    />
                </div>
                <p>or</p>
                <div className="row uri-input">
                    <input
                        id={`${elemId}-input`}
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button
                        disabled={text.trim() == ''}
                        type="button"
                        onClick={(e) => {
                            addFiles([text])
                            setText('')
                        }}
                    >
                        Add URI
                    </button>
                </div>
            </div>
            <FileList
                onChange={(files) => updateFiles(files)}
                files={files}
                canSort={false}
                showAsType={FileAsType.AS_URL}
                required={required}
            />
        </div>
    )
}

export { MultiUriInput }
