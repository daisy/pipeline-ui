import * as fs from 'fs-extra'
import path, { extname } from 'path'
import { unzipSync } from 'fflate'
import sax from 'sax'
import { Readable } from 'stream'
import { debug } from 'electron-log'

// find more info about the type of file
// returns "dtbook", "zedai", "xhtml", "html", "xml", "epub3opf", "epub2opf", "daisy3opf", "ncc"
// or if none of those fit, it returns the extension
export async function sniffFile(filepath: string): Promise<string> {
    const ext = extname(filepath).toLowerCase()

    if (path.basename(filepath).toLowerCase() == 'ncc.html') {
        return 'ncc'
    }

    // special case that seems to make the parser hang
    if (
        path.basename(filepath).startsWith('.#') ||
        path.basename(filepath).startsWith('#')
    ) {
        return ext
    }

    // handle opf, xml and html files with a quick sax parse
    if (ext == '.opf' || ext === '.xml' || ext === '.html' || ext == '.epub') {
        let stream = null

        // get a stream of the input file, whether by extracting it from an archive or just reading it off disk
        if (ext == '.epub') {
            // grab the opf file from the epub archive
            const zipFileHandle = await fs.readFile(filepath)
            const zipFileArr = new Uint8Array(zipFileHandle)
            const decompressed = unzipSync(zipFileArr, {
                // just get the OPF file, not other files
                filter(file) {
                    return file.name.length > 4 && file.name.slice(-4) == '.opf'
                },
            })
            if (Object.keys(decompressed).length > 0) {
                let opfBuffer = decompressed[Object.keys(decompressed)[0]]
                stream = new Readable()
                stream.push(opfBuffer)
                stream.push(null)
            }
        } else {
            // read the stream off disk
            stream = fs.createReadStream(filepath)
        }

        return new Promise<string>((resolve) => {
            let daisy3check = false
            let textContent = ''
            let parser
            try {
                parser = sax.createStream(true)
            } catch (err) {
                resolve(ext)
            }

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
                    debug('Parse error', ext)
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
                    dtbook2005: 'http://www.daisy.org/z3986/2005/dtbook/',
                    dtbook2002: 'http://www.daisy.org/z3986/2002/dtbook',
                    xhtml: 'http://www.w3.org/1999/xhtml',
                } as const

                if (ext == '.xml') {
                    if (namespaces.includes(namespaceValues.zedai)) {
                        stream.destroy()
                        resolve('zedai')
                    } else if (
                        namespaces.includes(namespaceValues.dtbook2005) ||
                        namespaces.includes(namespaceValues.dtbook2002)
                    ) {
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
                if (ext == '.opf' || ext == '.epub') {
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
                                'ANSI/NISO Z39.86-2005' ||
                            textContent.trim().toUpperCase() ==
                                'ANSI/NISO Z39.86-2002'
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
