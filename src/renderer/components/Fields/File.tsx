const { App } = window
import { useMemo, useState, useEffect } from 'react'

export enum FileAsType {
    AS_URL,
    AS_PATH,
}

// display a filepath as path or URL
export function File({ fileUrlOrPath, showAsType }) {
    const [value, setValue] = useState<string>(fileUrlOrPath)
    console.log("File rendering", value)
    useMemo(() => {
        const doConversion = async () => {
            if (showAsType == FileAsType.AS_PATH) {
                if (fileUrlOrPath.indexOf('file:') != -1) {
                    let aspath = await App.fileURLToPath(fileUrlOrPath)
                    console.log('setting value aspath', aspath)
                    setValue(aspath)
                } else {
                    // else it's already in path format
                    console.log('is already path', fileUrlOrPath)
                    setValue(fileUrlOrPath)
                }
            } else if (showAsType == FileAsType.AS_URL) {
                if (fileUrlOrPath.indexOf('file:') == -1) {
                    let asurl = await App.pathToFileURL(fileUrlOrPath)
                    setValue(asurl)
                } else {
                    // else it's already a URL
                    console.log('is already url', fileUrlOrPath)
                    setValue(fileUrlOrPath)
                }
            }
        }
        doConversion()
    }, [fileUrlOrPath])

    return <span className="file">{value}</span>
}
