const { APP_CONFIG } = require('./app.config')

const { NAME, AUTHOR, TITLE, DESCRIPTION, FOLDERS } = APP_CONFIG

const CURRENT_YEAR = new Date().getFullYear()
const AUTHOR_IN_KEBAB_CASE = AUTHOR.name.replace(/\s+/g, '-')
const APP_ID = `com.${AUTHOR_IN_KEBAB_CASE}.${NAME}`.toLowerCase()

module.exports = {
    appId: APP_ID,
    productName: TITLE,
    copyright: `Copyright © ${CURRENT_YEAR} — ${AUTHOR.name}`,

    directories: {
        app: FOLDERS.DEV_TEMP_BUILD,
        output: 'dist',
    },

    mac: {
        icon: `${FOLDERS.RESOURCES}/icons/logo.icns`,
        category: 'public.app-category.utilities',
    },

    dmg: {
        icon: false,
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
}
