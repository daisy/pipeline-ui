import { useState } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { FileList } from './FileList'

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
    enabled = true,
    required = false,
}) => {
    const [files, setFiles] = useState<string[]>(initialValue)
    const [text, setText] = useState<string>('')

    const addFiles = (newFiles: string[]) => {
        updateFiles([...files, ...newFiles])
    }
    let updateFiles = (changedFiles) => {
        setFiles(changedFiles)
        onChange?.(changedFiles)
    }
    return (
        <div className="multi-file-input">
            <input
                type="text"
                defaultValue={text}
                onBlur={(e) => {
                    setText(e.target.value)
                    e.target.value = ''
                }}
            />
            <button type="button" onClick={(e) => addFiles([text])}>
                Add
            </button>
            <FileInput
                elemId={elemId}
                allowFile={allowFile}
                allowFolder={false}
                mediaType={mediaType}
                onChange={(f) => {
                    if (f && f.length > 0) setText(f[0])
                }}
            />
            <FileList onChange={(files) => updateFiles(files)} files={files} />
        </div>
    )
}

export { MultiUriInput }
