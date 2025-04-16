import { readdirSync, statSync } from 'fs'
import { resolve } from 'path'

/**
 * recursive listing of files in a folder with filtering
 * @param {string} dir the directory to list files from
 * @param {function(string)} filter filter callback, that should return true if a file is matching it
 * @returns {string[]} the list of file path matching the filter
 */
export function walk(
    dir: string,
    filter?: (name: string) => boolean
): string[] {
    let results: string[] = []
    let list = readdirSync(dir)
    list.forEach(function (file) {
        file = resolve(dir, file)
        let stat = statSync(file)
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file))
        } else {
            /* Is a file */
            ;(!filter || filter(file)) && results.push(file)
        }
    })
    return results
}

// Dev notes :
// - port seeking in nodejs default to ipv6 ':::' for unset or localhost hostname
// - ipv4 and 6 do not share ports (based on some tests, one app could listen to an ipv4 port while another listen to the same on the ipv6 side)
//
// Some comments on SOF say that hostname resolution is OS dependent, but some clues on github issues for nodejs
// states that the resolution for 'localhost' defaults to ipv6, starting a version of nodejs i can't remember the number

const __baseUnpackagedPath = __dirname.endsWith('.asar')
    ? __dirname + '.unpacked'
    : __dirname

/**
 * Resolve a path relative to the asar unpacked folder
 * @param path path(es) to resolve
 * @returns the resolved path relative to the unpacked folder
 */
export const resolveUnpacked = (...path: string[]) => {
    return resolve(__baseUnpackagedPath, ...path)
}
