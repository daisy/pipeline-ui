// a browse button with a non-editable text field showing the selected file
import { useState, useEffect } from 'react'
import { FileInput, FileInputProps } from './FileInput'
import { debug } from 'electron-log'
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
    // useEffect(() => {
    //     console.log('Useeffect File', file)
    //     const doConversion = async () => {
    //         console.log('doing conversion')
    //         if (file.indexOf('file:') != -1) {
    //             let aspath = await App.fileURLToPath(file)
    //             console.log('setting value aspath', aspath)
    //             setFile(aspath)
    //         } else {
    //             // else it's already in path format
    //             console.log('is already path', file)
    //             setFile(file)
    //         }
    //     }
    //     doConversion()
    // }, [file])
    let isValid = () => required && file && file.trim() != ''
    // debug("SingleFileInput initialValue", initialValue)
    return (
        <div className="horizontal-input single-file-input">
            {file == '' || file == null && <span>No file selected</span>}
            {file != '' && (
                <>
                <File fileUrlOrPath={file} showAsType={FileAsType.AS_PATH}/>
                </>
            )}

            <FileInput
                elemId={elemId}
                allowFile={allowFile}
                allowFolder={allowFolder}
                allowMultiSelections={false}
                mediaType={mediaType}
                onChange={(values) => {
                    if (values && values.length > 0) {
                        console.log("FileInput onChange setFile", values[0])
                        setFile(values[0])
                        onChange?.(values)
                    }
                }}
                enabled={enabled}
            />
            {required && !isValid() && (
                <p className="error">Value cannot be empty</p>
            )}
        </div>
    )
}

export { SingleFileInput }
