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
  },
}
