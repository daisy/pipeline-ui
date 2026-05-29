import { debug } from 'electron-log'

// return the scripts relevant to the given filetype
export function getRelevantScripts(filetype, scripts) {
    let retval
    if (filetype == 'ncc') {
        retval = scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'daisy202')
        )
    } else if (filetype == 'daisy3opf') {
        retval = scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'daisy3')
        )
    } else if (filetype == 'epub3opf') {
        retval = scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'epub3')
        )
    } else if (filetype == 'epub2opf') {
        retval = scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'epub2')
        )
    } else if (filetype == 'word') {
        retval = scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'docx')
        )
    } else if (filetype == 'text/html' || filetype == 'application/xhtml+xml') {
        retval = scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'html')
        )
    } else if (filetype == 'pdf') {
        retval = scripts.filter((s) =>
            s.inputFilesets.some((f) => f == 'pdf')
        )
    } else {
        retval = scripts.filter((s) =>
            s.inputs.find((i) => i.mediaType.includes(filetype))
        )
    }
    return retval
}
