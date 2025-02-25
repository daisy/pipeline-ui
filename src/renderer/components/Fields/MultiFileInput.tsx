import { useState } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { FileList } from './FileList'

interface MultiFileInputProps extends FileInputProps {
    initialValue?: string[]
    required?: boolean
}

// a list of files with a browse button
const MultiFileInput: React.FC<MultiFileInputProps> = ({
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
    
    const addFiles = (newFiles: string[]) => {
        updateFiles([...files, ...newFiles])
    }
    let updateFiles = (changedFiles) => {
        console.log("MultiFileInput files", changedFiles)
        setFiles(changedFiles)
        onChange?.(changedFiles)
    }
    return (
        <div className="multi-file-input">
            <FileInput
                elemId={elemId}
                allowFile={allowFile}
                allowFolder={allowFolder}
                mediaType={mediaType}
                onChange={addFiles}
            />
            <FileList onChange={(files) => updateFiles(files)} files={files}/>
        </div>
    )
}

export { MultiFileInput }
