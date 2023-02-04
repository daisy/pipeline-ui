export const IPC = {
    WINDOWS: {
        ABOUT: {
            CREATE: 'windows: create-about-window',
            WHEN_CLOSE: 'windows: when-about-window-close',
        },
        SETTINGS: {
            CREATE: 'windows: create-settings-window',
            WHEN_CLOSE: 'windows: when-settings-window-close',
        },
    },
    // IPCS kept for pipeline logs outside of the store for now
    PIPELINE: {
        MESSAGES: {
            SEND: 'pipeline: messages-send',
            UPDATE: 'pipeline: messages-update',
            GET: 'pipeline: messages-get',
        },
        ERRORS: {
            SEND: 'pipeline: errors-send',
            UPDATE: 'pipeline: errors-update',
            GET: 'pipeline: errors-get',
        },
    },
    FILE: {
        SAVE: 'file: save',
        UNZIP: 'file: unzip',
        OPEN: 'file: open',
    },
    // Main store IPCs to sync proxy from full store
    STORE: {
        GET: 'store: get',
        UPDATED: 'store: updated',
    },
}
