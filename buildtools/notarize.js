const { APP_CONFIG } = require('../app.config')

const { APP_ID } = APP_CONFIG

require('dotenv').config()
// const { notarize } = require('electron-notarize')
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context
    if (electronPlatformName !== 'darwin') {
        return
    }
    if (!process.env.APPLE_ID) {
        console.log('skipped notarizing: APPLE_ID not set')
        return
    }
    if (process.env.SKIP_NOTARIZATION) {
        console.log('skipped notarizing: SKIP_NOTARIZATION=true')
        return
    }

    const appName = context.packager.appInfo.productFilename

    return await notarize({
        appBundleId: APP_ID,
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASS,
        ascProvider: process.env.APPLE_ID_TEAM,
        teamId: process.env.APPLE_ID_TEAM,
        tool: 'notarytool',
    })
}
