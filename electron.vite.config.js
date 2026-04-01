const { defineConfig } = require('electron-vite')
const { resolve } = require('path')
const { cpSync } = require('fs')
const react = require('@vitejs/plugin-react')

const { APP_CONFIG } = require('./app.config')

const isDev = process.env.NODE_ENV !== 'production'

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
            BUILD_ENABLE_MISTRAL:
                process.env.ENABLE_MISTRAL !== undefined
                    ? process.env.ENABLE_MISTRAL === 'true'
                    : isDev,
        },
        plugins: [
            {
                name: 'copy-resources',
                closeBundle() {
                    cpSync(
                        resolve(APP_CONFIG.FOLDERS.RESOURCES),
                        resolve('out/resources'),
                        { recursive: true }
                    )
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
                react: resolve('node_modules/react'),
            },
        },
        define: {
            'process.platform': JSON.stringify(process.platform),
            BUILD_ENABLE_MISTRAL:
                process.env.ENABLE_MISTRAL !== undefined
                    ? process.env.ENABLE_MISTRAL === 'true'
                    : isDev,
        },
        plugins: [react()],
        server: {
            port: 4927,
        },
    },
})
