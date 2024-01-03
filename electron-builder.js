const { APP_CONFIG } = require('./app.config')

const { APP_ID, AUTHOR, TITLE, DESCRIPTION, FOLDERS } = APP_CONFIG

const CURRENT_YEAR = new Date().getFullYear()
// take off the suffix '- App' -- we only want that to appear on the window title
let adjustedAppName = TITLE.replace(' - App', '')

module.exports = {
    appId: APP_ID,
    productName: adjustedAppName,
    copyright: `Copyright © ${CURRENT_YEAR} — ${AUTHOR.name}`,
    artifactName: 'daisy-pipeline-${version}-${os}.${ext}',
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
    },
    pkg: {
        isRelocatable: false,
        scripts: '../buildmac/pkg-scripts',
    },
    dmg: {
        icon: false,
        artifactName: 'daisy-pipeline-setup-${version}.${ext}',
    },

    linux: {
        category: 'Utilities',
        synopsis: DESCRIPTION,
        target: ['AppImage', 'deb', 'pacman', 'freebsd', 'rpm'],
    },

    win: {
        icon: `${FOLDERS.RESOURCES}/icons/logo_256x256.png`,
        target: ['nsis', 'portable', 'zip'],
    },
    afterSign: 'buildtools/notarize.js',
    asarUnpack: ['resources/daisy-pipeline'],
    nsis: {
        runAfterFinish: true,
        artifactName: 'daisy-pipeline-setup-${version}.${ext}',
    },
}
