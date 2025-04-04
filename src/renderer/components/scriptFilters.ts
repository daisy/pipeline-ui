import { useWindowStore } from 'renderer/store'
import { Script } from 'shared/types'

// return the scripts relevant to the given filetype
export function getRelevantScripts(filetype) {
    const { pipeline } = useWindowStore()
    if (filetype == 'ncc') {
        return pipeline.scripts.filter((s) => s.id.indexOf('daisy202-') != -1)
    }
    if (filetype == 'daisy3opf') {
        return pipeline.scripts
            .filter((s) => s.id.indexOf('daisy3-') != -1)
            .concat(
                pipeline.scripts.filter((s) => s.id.indexOf('nimas-') != -1)
            )
    }
    if (filetype == 'epub3opf') {
        return pipeline.scripts
            .filter((s) => s.id.indexOf('epub3-') != -1)
            .concat(pipeline.scripts.filter((s) => s.id.indexOf('epub-') != -1))
    }
    if (filetype == 'epub2opf') {
        return pipeline.scripts
            .filter((s) => s.id.indexOf('epub2-') != -1)
            .concat(pipeline.scripts.filter((s) => s.id.indexOf('epub-') != -1))
    }
    if (filetype == 'word') {
        return pipeline.scripts.filter((s) => s.id.indexOf('word-') != -1)
    }
    if (filetype == 'text/html' || filetype == 'application/xhtml+xml') {
        return pipeline.scripts.filter((s) => s.id.indexOf('html-') != -1)
    } else {
        return pipeline.scripts.filter((s) =>
            s.inputs.find((i) => i.mediaType.includes(filetype))
        )
    }
}

export function getRelevantFiletypes(script: Script) {
    if (script.id.indexOf('daisy202-') != -1) {
        return ['ncc']
    }
    if (
        script.id.indexOf('daisy3-') != -1 ||
        script.id.indexOf('nimas-') != -1
    ) {
        return ['daisy3opf']
    }
    if (script.id.indexOf('epub3-') != -1) {
        return ['epub3opf']
    }
    if (script.id.indexOf('epub2-') != -1) {
        return ['epub2opf']
    }
    if (script.id.indexOf('epub-') != -1) {
        return ['epub3opf', 'epub2opf']
    }
    if (script.id.indexOf('word-') != -1) {
        return ['word']
    }
    if (script.id.indexOf('html-') != -1) {
        return ['text/html', 'application/xhtml+xml']
    }
}
