import { createReadStream } from 'fs'
import path, { extname } from 'path'
import sax from 'sax'

// find more info about the type of file
// returns "dtbook", "zedai", "xhtml", "html", "xml", "epub3opf", "epub2opf", "daisy3opf", "ncc"
// or if none of those fit, it returns the extension
export async function sniffFile(filepath: string): Promise<string> {
    const ext = extname(filepath).toLowerCase()
    if (path.basename(filepath).toLowerCase() == 'ncc.html') {
        return 'ncc'
    }
    // handle opf, xml and html files with a quick sax parse
    if (ext == '.opf' || ext === '.xml' || ext === '.html') {
        return new Promise<string>((resolve) => {
            let daisy3check = false
            let textContent = ''
            const parser = sax.createStream(true)
            const stream = createReadStream(filepath.replace('file:///', '/'))

            parser.on('error', (err: Error) => {
                // it couldn't be parsed as xml and it has an html extension
                // therefore it's html
                if (ext === '.html') {
                    stream.destroy()
                    resolve('html')
                }
                // or there was another type of error and we can't tell any more info about this file 
                else {
                    stream.destroy()
                    resolve(ext)
                }
            })

            parser.on('end', () => {
                // we made it through the xml parse of the file and it was an html file so it must be xhtml
                if (ext == '.html') {
                    resolve('xhtml')
                }
            })

            parser.on('opentag', (node) => {
                textContent = ''
                const namespaces = Object.entries(node.attributes)
                    .filter(([key]) => key.startsWith('xmlns'))
                    .map(([_, value]) => value)

                // check the namespace on the root element
                const namespaceValues = {
                    zedai: 'http://www.daisy.org/ns/z3998/authoring/',
                    dtbook: 'http://www.daisy.org/z3986/2005/dtbook/',
                    xhtml: 'http://www.w3.org/1999/xhtml',
                } as const

                if (ext == '.xml') {
                    if (namespaces.includes(namespaceValues.zedai)) {
                        stream.destroy()
                        resolve('zedai')
                    } else if (namespaces.includes(namespaceValues.dtbook)) {
                        stream.destroy()
                        resolve('dtbook')
                    } else {
                        stream.destroy()
                        resolve('xml')
                    }
                }

                if (ext == '.html') {
                    if (namespaces.includes(namespaceValues.xhtml)) {
                        stream.destroy()
                        resolve('xhtml')
                    }
                }

                // EPUB opf can also be identified from the root element
                if (ext == '.opf') {
                    let version = Object.entries(node.attributes).find(
                        ([key]) => key.startsWith('version')
                    )
                    // @ts-ignore
                    if (version && version.length > 0) {
                        if (version[1] == '3.0') {
                            stream.destroy()
                            resolve('epub3opf')
                        }
                        if (version[1] == '2.0') {
                            stream.destroy()
                            resolve('epub2opf')
                        }
                    }
                    if (node.name == 'dc:Format') {
                        daisy3check = true
                    }
                }
            })

            parser.on('text', (text) => {
                if (daisy3check) {
                    textContent += text
                }
            })

            parser.on('closetag', (tagName) => {
                if (daisy3check) {
                    if (tagName == 'dc:Format') {
                        if (
                            textContent.trim().toUpperCase() ==
                            'ANSI/NISO Z39.86-2005'
                        ) {
                            stream.destroy()
                            resolve('daisy3opf')
                        }
                    }
                }
            })

            stream.pipe(parser)
        })
    } // end if xml opf or html
    return Promise.resolve(ext.slice(1))
}
