// a browse button with a non-editable text field showing the selected file
import { useState } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { getArr0 } from 'renderer/utils'
import { File, FileAsType } from './File'

const { App } = window
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
    let isValid = () => required && file && file.trim() != ''
    // debug("SingleFileInput initialValue", initialValue)
    let getLabel = () => {
        let str = 'Select '
        if (allowFile) {
            str += 'file'
            if (allowFolder) {
                str += ' or folder'
            }
        } else if (allowFolder) {
            str += 'folder'
        }

        return str
    }
    return (
        <div className="single-file-input">
            <FileInput
                elemId={elemId}
                allowFile={allowFile}
                allowFolder={allowFolder}
                allowMultiSelections={false}
                mediaType={mediaType}
                onChange={(values) => {
                    if (values && values.length > 0) {
                        setFile(values[0])
                        onChange?.(values)
                    }
                }}
                enabled={enabled}
                label={getLabel()}
            />
            {file != '' && (
                <>
                    <File
                        fileUrlOrPath={file}
                        showAsType={FileAsType.AS_PATH}
                    />
                </>
            )}

            {required && !isValid() && <p className="error">File required</p>}
        </div>
    )
}

export { SingleFileInput }
