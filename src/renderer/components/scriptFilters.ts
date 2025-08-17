import { useWindowStore } from 'renderer/store'
import { debug } from 'electron-log'

// return the scripts relevant to the given filetype
export function getRelevantScripts(filetype) {
    const { pipeline } = useWindowStore()
    let retval
    if (filetype == 'ncc') {
        retval = pipeline.scripts.filter((s) => s.id.indexOf('daisy202-') != -1)
    } else if (filetype == 'daisy3opf') {
        retval = pipeline.scripts
            .filter((s) => s.id.indexOf('daisy3-') != -1)
            .concat(
                pipeline.scripts.filter((s) => s.id.indexOf('nimas-') != -1)
            )
    } else if (filetype == 'epub3opf') {
        retval = pipeline.scripts
            .filter((s) => s.id.indexOf('epub3-') != -1)
            .concat(pipeline.scripts.filter((s) => s.id.indexOf('epub-') != -1))
    } else if (filetype == 'epub2opf') {
        retval = pipeline.scripts
            .filter((s) => s.id.indexOf('epub2-') != -1)
            .concat(pipeline.scripts.filter((s) => s.id.indexOf('epub-') != -1))
    } else if (filetype == 'word') {
        retval = pipeline.scripts.filter((s) => s.id.indexOf('word-') != -1)
    } else if (filetype == 'text/html' || filetype == 'application/xhtml+xml') {
        retval = pipeline.scripts.filter((s) => s.id.indexOf('html-') != -1)
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
