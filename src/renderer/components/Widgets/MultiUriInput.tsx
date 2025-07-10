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
        <div className="multi-file-input">
            <label htmlFor={`${elemId}-input`}>
                Enter a file url or browse for a local file:
            </label>
            <div className="row">
                <input
                    id={`${elemId}-input`}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <FileInput
                    elemId={elemId}
                    allowFile={allowFile}
                    allowFolder={allowFolder}
                    mediaType={mediaType}
                    onChange={(f) => {
                        if (f && f.length > 0) setText(f[0])
                    }}
                />
                <button
                    disabled={text.trim() == ''}
                    type="button"
                    onClick={(e) => addFiles([text])}
                >
                    Add
                </button>
            </div>
            <FileList
                onChange={(files) => updateFiles(files)}
                files={files}
                canSort={false}
                showAsType={FileAsType.AS_URL}
            />
        </div>
    )
}

export { MultiUriInput }
