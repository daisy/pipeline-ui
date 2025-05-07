import { useState, useMemo } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { FileList } from './FileList'
import { FileAsType } from './File'
const { App } = window

interface MultiFileInputProps extends FileInputProps {
    initialValue?: string[]
    required?: boolean
    canSort?: boolean
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
    canSort = true,
}) => {
    const [files, setFiles] = useState<string[]>([])

    useMemo(() => {
        // convert the initialValue from fileURL to filepath if necessary
        const doConversion = async () => {
            let filesAsPaths = []
            for (let somefile of initialValue) {
                let fileAsPath = await App.fileURLToPath(somefile)
                filesAsPaths.push(fileAsPath)
            }
            setFiles(filesAsPaths)
        }
        doConversion()
    }, [initialValue])

    const addFiles = async (newFiles: string[]) => {
        updateFiles(Array.from(new Set([...files, ...newFiles])))
    }
    let updateFiles = (changedFiles) => {
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
                label={files.length ? 'Add file' : 'Select file'}
            />
            <FileList
                showAsType={FileAsType.AS_PATH}
                onChange={(files) => updateFiles(files)}
                files={files}
                canSort={canSort}
            />
        </div>
    )
}

export { MultiFileInput }
