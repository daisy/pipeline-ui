// this list is useful when filtering the file browse view
// it gives some guidance for which files have what mimetypes

import { Filetype } from 'shared/types'

// it does not indicate which scripts can work with which files
export const mediaTypesFileFilters: Array<Filetype> = [
    {
        type: '*',
        name: 'All files',
        extensions: ['*'],
    },
    {
        type: 'application/oebps-package+xml',
        name: 'Package File',
        extensions: ['opf'],
    },
    {
        type: 'application/x-dtbook+xml',
        name: 'DTBook',
        extensions: ['xml'],
    },
    {
        type: 'application/epub+zip',
        name: 'EPUB',
        extensions: ['epub'],
    },
    {
        type: 'application/vnd.pipeline.tts-config+xml',
        name: 'TTS Config',
        extensions: ['xml'],
    },
    {
        type: 'application/xhtml+xml',
        name: 'HTML Document',
        extensions: ['html', 'xhtml'],
    },
    {
        type: 'application/xml',
        name: 'XML Document',
        extensions: ['xml'],
    },
    {
        type: 'application/z3998-auth+xml',
        name: 'ZedAI Document',
        extensions: ['xml'],
    },
    {
        type: 'text/html',
        name: 'HTML Document',
        extensions: ['html'],
    },
    {
        type: 'text/css',
        name: 'CSS Document',
        extensions: ['css'],
    },
    {
        type: 'text/x-scss',
        name: 'SCSS Document',
        extensions: ['scss'],
    },
    {
        type: 'application/xslt+xml',
        name: 'XSLT Document',
        extensions: ['xsl', 'xslt'],
    },
    {
        type: 'text/plain',
        name: 'Plain text',
        extensions: ['txt'],
    },
    {
        type: 'application/vnd.oasis.opendocument.text-template',
        name: 'Open Office Template',
        extensions: ['ott'],
    },
    {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        name: 'Word Document',
        extensions: ['docx'],
    },
    {
        type: 'application/pls+xml',
        name: 'Lexicon',
        extensions: ['pls'],
    },
]

// this is a set of filetypes that are accepted as primary script inputs
let scriptInputFiletypes: Array<Filetype> = [
    {
        type: 'ncc',
        name: 'DAISY 2.02',
        extensions: ['html'],
    },
    {
        type: 'daisy3opf',
        name: 'DAISY 3',
        extensions: ['opf'],
    },
    {
        type: 'epub3opf',
        name: 'EPUB 3',
        extensions: ['opf'],
    },
    {
        type: 'epub2opf',
        name: 'EPUB 2',
        extensions: ['opf'],
    },
    {
        type: 'word',
        name: 'Word',
        extensions: ['docx'],
    },
]
// filter out the things that are never found as script sources
scriptInputFiletypes = scriptInputFiletypes.concat(
    mediaTypesFileFilters.filter(
        (mt) =>
            mt.type != 'text/plain' &&
            mt.type != 'text/x-scss' &&
            mt.type != 'text/css' &&
            mt.type != 'application/xml' &&
            mt.type != 'application/vnd.pipeline.tts-config+xml' &&
            mt.type != 'application/pls+xml' &&
            mt.type != '*'
    )
)

export { scriptInputFiletypes }
