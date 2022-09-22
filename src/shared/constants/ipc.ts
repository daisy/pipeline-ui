export const IPC = {
  WINDOWS: {
    ABOUT: {
      CREATE: 'windows: create-about-window',
      WHEN_CLOSE: 'windows: when-about-window-close',
    },
  },
  PIPELINE: {
    START: 'pipeline: start',
    STOP: 'pipeline: stop',
    STATE: {
      GET: 'pipeline: state-get',
      CHANGED: 'pipeline: state-changed',
    },
    PROPS: {
      GET: 'pipeline: props-get',
    },
    MESSAGES: {
      UPDATE: 'pipeline: messages-update',
      GET: 'pipeline: messages-get',
    },
    ERRORS: {
      UPDATE: 'pipeline: errors-update',
      GET: 'pipeline: errors-get',
    },
  },
}
