const { APP_CONFIG } = require('./app.config')

const { APP_ID, AUTHOR, TITLE, DESCRIPTION, FOLDERS, ARTIFACT_NAME } =
    APP_CONFIG

const CURRENT_YEAR = new Date().getFullYear()
// take off the suffix '- App' -- we only want that to appear on the window title
let adjustedAppName = TITLE.replace(' - App', '')
module.exports = {
    appId: APP_ID,
    productName: adjustedAppName,
    copyright: `Copyright © ${CURRENT_YEAR} — ${AUTHOR.name}`,
    artifactName: ARTIFACT_NAME + '-${version}-${os}.${ext}',
    directories: {
        app: FOLDERS.DEV_TEMP_BUILD,
        output: 'dist',
    },

    mac: {
        icon: `${FOLDERS.RESOURCES}/icons/logo.icns`,
        category: 'public.app-category.utilities',
        identity: 'US Fund for DAISY (SAMG8AWD69)',
        hardenedRuntime: true,
        target: 'pkg',
        "extendInfo": {
            "LSUIElement": 1
        },
    },
    pkg: {
        isRelocatable: false,
        scripts: '../buildmac/pkg-scripts',
    },
    dmg: {
        icon: false,
        artifactName: ARTIFACT_NAME + '-setup-${version}.${ext}',
    },

    linux: {
        category: 'Utilities',
        synopsis: DESCRIPTION,
        target: ['AppImage', 'deb', 'pacman', 'freebsd', 'rpm'],
    },

    win: {
        icon: `${FOLDERS.RESOURCES}/icons/logo_256x256.png`,
        target: ['nsis'],
    },
    afterSign: 'buildtools/notarize.js',
    asarUnpack: ['resources/daisy-pipeline'],
    nsis: {
        include: 'build/installer.nsh',
        runAfterFinish: true,
        artifactName: ARTIFACT_NAME + '-setup-${version}.${ext}',
    },
}
