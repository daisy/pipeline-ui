import { useWindowStore } from 'renderer/store'
import { debug } from 'electron-log'

// return the scripts relevant to the given filetype
export function getRelevantScripts(filetype) {
    const { pipeline } = useWindowStore()
    let retval
    debug('getRelevantScripts filetype', filetype)
    if (filetype == 'ncc') {
        retval = pipeline.scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'daisy202')
        )
    } else if (filetype == 'daisy3opf') {
        retval = pipeline.scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'daisy3')
        )
    } else if (filetype == 'epub3opf') {
        retval = pipeline.scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'epub3')
        )
    } else if (filetype == 'epub2opf') {
        retval = pipeline.scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'epub2')
        )
    } else if (filetype == 'word') {
        retval = pipeline.scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'docx')
        )
    } else if (filetype == 'text/html' || filetype == 'application/xhtml+xml') {
        retval = pipeline.scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'html')
        )
    } else if (filetype == 'pdf') {
        retval = pipeline.scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'pdf')
        )
    } else {
        retval = pipeline.scripts.filter((s) =>
            s.inputs.find((i) => i.mediaType.includes(filetype))
        )
    }
    // debug(
    //     `Relevant scripts for ${filetype}: ${JSON.stringify(
    //         retval.map((v) => v?.id ?? '')
    //     )}`
    // )
    return retval
}
