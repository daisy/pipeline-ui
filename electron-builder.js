const { APP_CONFIG } = require('./app.config')
const { execSync } = require('child_process')

const { APP_ID, AUTHOR, TITLE, DESCRIPTION, FOLDERS, ARTIFACT_NAME } =
    APP_CONFIG

const CURRENT_YEAR = new Date().getFullYear()
// take off the suffix '- App' -- we only want that to appear on the window title
let adjustedAppName = TITLE.replace(' - App', '')

const devVersion = process.env.DEV_BUILD === 'true'
    ? (() => {
        const { version } = require('./package.json')
        const hash = execSync('git rev-parse --short HEAD').toString().trim()
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
        return `${version}-${branch}-${hash}`
    })()
    : undefined

module.exports = {
    ...(devVersion ? { extraMetadata: { version: devVersion } } : {}),
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
        notarize: false,
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
    publish: {
        provider: 'github',
        releaseType: 'draft',
    },
    afterSign: 'buildtools/notarize.js',
    asarUnpack: ['resources/daisy-pipeline'],
    nsis: {
        include: 'build/installer.nsh',
        runAfterFinish: true,
        artifactName: ARTIFACT_NAME + '-setup-${version}.${ext}',
    },
}
