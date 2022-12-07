const process = require('process')
const { exec } = require('child_process')
const { resolve } = require('path')

const packageJSON = require('../../package.json')

async function fixPermissions() {
    console.log('Fixing permissions for unix systems ...')
    const { devTempBuildFolder } = packageJSON
    // For unix system,
    // we need to fix the jre permissions to add the execution flag
    // Because the CopyWebpackPlugin does not keep permissions
    if (process.platform !== 'win32') {
        exec(`chmod -R +x ${resolve(devTempBuildFolder, 'resources')}`)
    }
}

fixPermissions()
