const { resolve } = require('path')
const webpack = require('webpack')

const { sharedOptions } = require('./shared.config')
const { isDev } = require('./utils')
const { APP_CONFIG } = require('../app.config')

const { FOLDERS } = APP_CONFIG

module.exports = {
    target: 'electron-main',

    ...sharedOptions,

    entry: {
        main: resolve(FOLDERS.ENTRY_POINTS.MAIN),
        bridge: resolve(FOLDERS.ENTRY_POINTS.BRIDGE),
    },

    output: {
        path: resolve(FOLDERS.DEV_TEMP_BUILD),
        filename: '[name].js',
    },

    plugins: [
        ...(sharedOptions.plugins ?? []),
        new webpack.DefinePlugin({
            BUILD_LOG_LEVEL: JSON.stringify(process.env.LOG_LEVEL),
            BUILD_ENABLE_MISTRAL: process.env.ENABLE_MISTRAL !== undefined
                ? process.env.ENABLE_MISTRAL === 'true'
                : isDev,
        }),
    ],
}
