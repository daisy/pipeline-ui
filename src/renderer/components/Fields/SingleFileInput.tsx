// a browse button with a non-editable text field showing the selected file
import { useState } from 'react'
import { FileInput, FileInputProps } from './FileInput'

interface SingleFileInputProps extends FileInputProps {
    initialValue?: string
    required?: boolean
}

// a text input field with a browse button
const SingleFileInput: React.FC<SingleFileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    allowFile = true,
    allowFolder = false,
    initialValue = '',
    enabled = true,
    required = false,
}) => {
    const [file, setFile] = useState<string>(initialValue)
    let fileChanged = (values) => {
        console.log("fileChanged", values)
        if (values && values.length > 0) {
            setFile(values[0])
            onChange?.(values[0])
        }
    }
    let isValid = () => required && file && file.trim() != ''

    return (
        <div className="horizontal-input single-file-input">
            <span>{file != '' ? file : 'No file selected'}</span>
            <FileInput
                elemId={elemId}
                allowFile={allowFile}
                allowFolder={allowFolder}
                mediaType={mediaType}
                onChange={fileChanged}
                enabled={enabled}
            />
            {required && !isValid() && (
                <p className="error">Value cannot be empty</p>
            )}
        </div>
    )
}

export { SingleFileInput }
