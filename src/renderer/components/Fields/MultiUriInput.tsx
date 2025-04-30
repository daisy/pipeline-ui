import { useState } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { FileList } from './FileList'
import { FileAsType } from '../File'

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
        // make list unique
        updateFiles(Array.from(new Set([...files, ...newFiles])))
    }
    let updateFiles = (changedFiles) => {
        setFiles(changedFiles)
        onChange?.(changedFiles)
    }
    return (
        <div className="multi-file-input">
            <p>Enter a file url or browse for a local file:</p>
            <div>
                <input
                    type="text"
                    value={text}
                    onBlur={(e) => {
                        setText(e.target.value)
                    }}
                    onChange={(e) => setText(e.target.value)}
                />
                <FileInput
                    elemId={elemId}
                    allowFile={allowFile}
                    allowFolder={false}
                    mediaType={mediaType}
                    onChange={(f) => {
                        console.log('browsed for', f)
                        if (f && f.length > 0) setText(f[0])
                    }}
                />
            </div>
            <button type="button" onClick={(e) => addFiles([text])}>
                Add
            </button>

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
