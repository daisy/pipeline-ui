// a browse button with a non-editable text field showing the selected file
import { useState } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { debug } from 'electron-log'
import { getArr0 } from 'renderer/utils'
import { File, FileAsType } from '../File'

// a text input field with a browse button
const SingleFileInput: React.FC<FileInputProps> = ({
    elemId,
    mediaType = ['*'],
    onChange,
    allowFile = true,
    allowFolder = false,
    initialValue = [''],
    enabled = true,
    required = false,
}) => {
    const [file, setFile] = useState<string>(getArr0(initialValue))
    let fileChanged = (values) => {
        debug('SingleFileInput fileChanged', values)
        if (values && values.length > 0) {
            setFile(values[0])
            onChange?.(values[0])
        }
    }
    let isValid = () => required && file && file.trim() != ''
    // debug("SingleFileInput initialValue", initialValue)
    return (
        <div className="horizontal-input single-file-input">
            {file == '' && <span>No file selected</span>}
            {file != '' && (
                <File fileUrlOrPath={file} showAsType={FileAsType.AS_PATH} />
            )}

            <FileInput
                elemId={elemId}
                allowFile={allowFile}
                allowFolder={allowFolder}
                allowMultiSelections={false}
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
