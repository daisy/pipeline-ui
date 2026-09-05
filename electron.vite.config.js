const { defineConfig } = require('electron-vite')
const { resolve } = require('path')
const { cpSync, existsSync } = require('fs')
const react = require('@vitejs/plugin-react')

const { APP_CONFIG } = require('./app.config')
const {
    getExperimentalReleaseInfo,
    getSnapshotInfo,
} = require('./build-snapshot-info')

const isDev = process.env.NODE_ENV !== 'production'
const isDevBuild = process.env.DEV_BUILD === 'true'
const isExperimentalReleaseBuild =
    process.env.EXPERIMENTAL_RELEASE_BUILD === 'true'

const featureFlagEnabled = (name) =>
    process.env[name] !== undefined ? process.env[name] === 'true' : isDev

const enableOcr = featureFlagEnabled('ENABLE_OCR')
const enableExternalEngine = featureFlagEnabled('ENABLE_EXTERNAL_ENGINE')

const buildVersion = isExperimentalReleaseBuild
    ? (() => {
          const { releaseName } = getExperimentalReleaseInfo()
          return releaseName
      })()
    : isDevBuild
      ? (() => {
            const { releaseName } = getSnapshotInfo()
            return releaseName
        })()
      : undefined
const buildDescription =
    !isExperimentalReleaseBuild && isDevBuild
        ? (() => {
              const { releaseDescription } = getSnapshotInfo()
              return releaseDescription
          })()
        : undefined

console.log('Build options:')
console.log('  LOG_LEVEL:              ', process.env.LOG_LEVEL || '(default: info)')
console.log('  ENABLE_OCR:             ', enableOcr)
console.log('  ENABLE_EXTERNAL_ENGINE: ', enableExternalEngine)
console.log('  BUILD_VERSION:          ', buildVersion || '(from package.json)')
console.log('  BUILD_DETAILS:          ', buildDescription || '(none)')

module.exports = defineConfig({
    main: {
        resolve: {
            alias: {
                main: resolve('src/main'),
                shared: resolve('src/shared'),
                '~': resolve('.'),
            },
        },
        define: {
            BUILD_LOG_LEVEL: JSON.stringify(process.env.LOG_LEVEL),
            BUILD_ENABLE_OCR: enableOcr,
            BUILD_ENABLE_EXTERNAL_ENGINE: enableExternalEngine,
        },
        plugins: [
            {
                name: 'copy-resources',
                closeBundle() {
                    const src = resolve(APP_CONFIG.FOLDERS.RESOURCES)
                    if (existsSync(src)) {
                        cpSync(src, resolve('out/resources'), {
                            recursive: true,
                        })
                    } else {
                        console.warn('Resources not found, skipping copy:', src)
                    }
                },
            },
        ],
    },

    preload: {
        build: {
            rollupOptions: {
                external: ['electron'],
                input: {
                    bridge: resolve(APP_CONFIG.FOLDERS.ENTRY_POINTS.BRIDGE),
                },
                output: {
                    format: 'cjs',
                    entryFileNames: '[name].js',
                },
            },
        },
        resolve: {
            alias: {
                shared: resolve('src/shared'),
                '~': resolve('.'),
            },
        },
        define: {
            BUILD_ENABLE_EXTERNAL_ENGINE: enableExternalEngine,
        },
    },

    renderer: {
        root: resolve('src/renderer'),
        build: {
            rollupOptions: {
                input: resolve(APP_CONFIG.FOLDERS.INDEX_HTML),
            },
        },
        resolve: {
            alias: {
                renderer: resolve('src/renderer'),
                shared: resolve('src/shared'),
                '~': resolve('.'),
            },
        },
        define: {
            'process.platform': JSON.stringify(process.platform),
            BUILD_ENABLE_OCR: enableOcr,
            BUILD_ENABLE_EXTERNAL_ENGINE: enableExternalEngine,
            BUILD_DETAILS: JSON.stringify(buildDescription),
            BUILD_VERSION: JSON.stringify(buildVersion),
        },
        plugins: [react()],
        server: {
            port: 4927,
        },
    },
})
