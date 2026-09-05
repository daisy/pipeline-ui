const { APP_CONFIG } = require('./app.config')
const {
    getExperimentalReleaseInfo,
    getSnapshotInfo,
} = require('./build-snapshot-info')

const { APP_ID, AUTHOR, TITLE, DESCRIPTION, FOLDERS, ARTIFACT_NAME } =
    APP_CONFIG

const CURRENT_YEAR = new Date().getFullYear()
// take off the suffix '- App' -- we only want that to appear on the window title
let adjustedAppName = TITLE.replace(' - App', '')

const buildVersion =
    process.env.EXPERIMENTAL_RELEASE_BUILD === 'true'
        ? (() => {
              const { releaseName } = getExperimentalReleaseInfo()
              return releaseName
          })()
        : process.env.DEV_BUILD === 'true'
          ? (() => {
                const { releaseName } = getSnapshotInfo()
                return releaseName
            })()
          : undefined

module.exports = {
    ...(buildVersion ? { extraMetadata: { version: buildVersion } } : {}),
    appId: APP_ID,
    productName: adjustedAppName,
    copyright: `Copyright © ${CURRENT_YEAR} — ${AUTHOR.name}`,
    // Added -${arch} here so global artifacts remain unique
    artifactName: ARTIFACT_NAME + '-${version}-${os}-${arch}.${ext}',
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
        extendInfo: {
            LSUIElement: 1,
        },
        // Mac-only: adds "Open With > DAISY Pipeline" to Finder for these file
        // types without claiming default-handler status (role: 'Viewer').
        // Do NOT hoist this to the top level -- on Windows, electron-builder's
        // NSIS target treats fileAssociations as a real default-association
        // claim (APP_ASSOCIATE registers "shell\open" for the extension), which
        // silently made Pipeline the default handler for .epub/.docx on install.
        // Windows context-menu entries are handled separately and deliberately
        // in build/installer.nsh (SystemFileAssociations verbs only).
        fileAssociations: [
            {
                ext: 'epub',
                name: 'EPUB',
                description: 'Open with DAISY Pipeline',
                role: 'Viewer',
            },
            {
                ext: 'opf',
                name: 'OPF Package Document',
                description: 'Open with DAISY Pipeline',
                role: 'Viewer',
            },
            {
                ext: 'docx',
                name: 'Word Document',
                description: 'Open with DAISY Pipeline',
                role: 'Viewer',
            },
        ],
    },
    pkg: {
        isRelocatable: false,
        scripts: '../buildmac/pkg-scripts',
    },
    dmg: {
        icon: false,
        // Added -${arch} to avoid the builds overwriting each other
        artifactName: ARTIFACT_NAME + '-setup-${version}-${arch}.${ext}',
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
