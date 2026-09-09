import type { Filetype, Script } from 'shared/types'

export type UnsupportedFileCounts = {
    unrecognized: number
    noRelevantScript: number
}

// return the scripts relevant to the given filetype
export function getRelevantScripts(filetype: string, scripts: Script[] = []) {
    let retval
    if (filetype == 'ncc') {
        retval = scripts.filter((s) =>
            s.inputFilesets?.some((f) => f == 'daisy202')
        )
    } else if (filetype == 'daisy3opf') {
        retval = scripts.filter((s) =>
            s.inputFilesets?.some((f) => f == 'daisy3')
        )
    } else if (filetype == 'epub3opf') {
        retval = scripts.filter((s) =>
            s.inputFilesets?.some((f) => f == 'epub3')
        )
    } else if (filetype == 'epub2opf') {
        retval = scripts.filter((s) =>
            s.inputFilesets?.some((f) => f == 'epub2')
        )
    } else if (filetype == 'word') {
        retval = scripts.filter((s) =>
            s.inputFilesets?.some((f) => f == 'docx')
        )
    } else if (filetype == 'text/html' || filetype == 'application/xhtml+xml') {
        retval = scripts.filter((s) =>
            s.inputFilesets?.some((f) => f == 'html')
        )
    } else if (filetype == 'pdf') {
        retval = scripts.filter((s) => s.inputFilesets?.some((f) => f == 'pdf'))
    } else {
        retval = scripts.filter((s) =>
            s.inputs?.find((i) => i.mediaType?.includes(filetype))
        )
    }
    return retval
}

export function hasRelevantScripts(
    filetype: Filetype | null,
    scripts: Script[] = []
) {
    if (!filetype) return false
    return getRelevantScripts(filetype.type, scripts).length > 0
}

export function getUnsupportedFilesMessage(
    counts: UnsupportedFileCounts,
    acceptedCount: number
) {
    const rejectedCount = counts.unrecognized + counts.noRelevantScript
    if (rejectedCount == 0) return ''

    if (acceptedCount > 0) {
        return rejectedCount == 1
            ? '1 file was not added because its file type is not recognized or no compatible script is installed'
            : `${rejectedCount} files were not added because their file types are not recognized or no compatible scripts are installed`
    }

    if (counts.unrecognized > 0 && counts.noRelevantScript > 0) {
        return 'File types not recognized or no compatible scripts available'
    }

    if (counts.noRelevantScript > 0) {
        return rejectedCount == 1
            ? 'No compatible script available for this file type'
            : 'No compatible scripts available for these file types'
    }

    return rejectedCount == 1
        ? 'File type not recognized'
        : 'File types not recognized'
}
