const { writeFile } = require('fs/promises')
const { resolve, relative } = require('path')

const packageJSON = require('../../../package.json')

async function createPackageJSONDistVersion() {
    const {
        main,
        scripts,
        devDependencies,
        devTempBuildFolder,
        ...restOfPackageJSON
    } = packageJSON

    const packageJSONDistVersion = {
        main: './' + relative(resolve(devTempBuildFolder), resolve(main)),
        ...restOfPackageJSON,
    }

    try {
        console.log('Export the package.json for the dist version...')
        await writeFile(
            resolve(devTempBuildFolder, 'package.json'),
            JSON.stringify(packageJSONDistVersion, null, 2)
        )
    } catch ({ message }) {
        console.log(`
    🛑 Something went wrong!\n
      🧐 There was a problem creating the package.json dist version...\n
      👀 Error: ${message}
    `)
    }
}

createPackageJSONDistVersion()

// Also fix permissions of the app resources after building the app for distribution
require('../../utils/fixPermissions')
