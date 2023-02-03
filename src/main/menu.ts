export function buildMenuTemplate({
    appName,
    onCreateJob,
    onShowSettings,
    onLearnMore,
    onUserGuide,
    onTestIncrement,
    onTestDecrement,
    onNextTab,
    onPrevTab,
    onGotoTab,
    onFocusCurrentTab, // this could put the cursor on the current tab contents
}) {
    const isMac = process.platform === 'darwin'

    // Template taken from electron documentation
    // To be completed
    // @ts-ignore
    const template: MenuItemConstructorOptions = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                  {
                      label: appName,
                      submenu: [
                          { role: 'services' },
                          { type: 'separator' },
                          { role: 'hide' },
                          { role: 'hideOthers' },
                          { role: 'unhide' },
                          { type: 'separator' },
                          { role: 'quit' },
                      ],
                  },
              ]
            : []),
        // { role: 'fileMenu' }
        {
            label: 'File',
            submenu: [
                {
                    label: 'Create a new job',
                    click: onCreateJob,
                },
                {
                    label: 'Settings',
                    click: onShowSettings,
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' },
            ],
        },
        {
            label: 'Edit',
            submenu: [{ role: 'copy' }, { role: 'paste' }],
        },
        {
            label: 'Test',
            submenu: [
                {
                    label: 'Value is',
                    click: async () => {
                        await alert('Value is')
                    },
                },
                {
                    label: 'Increment',
                    click: onTestIncrement,
                },
                {
                    label: 'Decrement',
                    click: onTestDecrement,
                },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
            ],
        },
        {
            label: 'Goto',
            submenu: [
                {
                    label: 'Next tab',
                    click: onNextTab,
                },
                {
                    label: 'Previous tab',
                    click: onPrevTab,
                },
                { type: 'separator' },
                {
                    label: '1. New Job (idle)',
                },
                {
                    label: '2. New Job (running)',
                },
                {
                    label: '3. DTBook to EPUB 3 (complete)',
                },
            ],
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn more',
                    click: onLearnMore,
                },
                {
                    label: 'User guide',
                    click: onUserGuide,
                },
            ],
        },
    ]

    return template
}
