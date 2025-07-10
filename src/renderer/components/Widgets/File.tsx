const { App } = window
import { useMemo, useState } from 'react'

export enum FileAsType {
    AS_URL,
    AS_PATH,
}

// display a filepath as path or URL
export function File({ fileUrlOrPath, showAsType }) {
    const [value, setValue] = useState<string>(fileUrlOrPath)
    useMemo(() => {
        const doConversion = async () => {
            if (showAsType == FileAsType.AS_PATH) {
                if (fileUrlOrPath.indexOf('file:') != -1) {
                    let aspath = await App.fileURLToPath(fileUrlOrPath)
                    setValue(aspath)
                } else {
                    // else it's already in path format
                    setValue(fileUrlOrPath)
                }
            } else if (showAsType == FileAsType.AS_URL) {
                if (fileUrlOrPath.indexOf('file:') == -1) {
                    let asurl = await App.pathToFileURL(fileUrlOrPath)
                    setValue(asurl)
                } else {
                    // else it's already a URL
                    setValue(fileUrlOrPath)
                }
            }
        }
        doConversion()
    }, [fileUrlOrPath])

    return <span className="file">{value}</span>
}
