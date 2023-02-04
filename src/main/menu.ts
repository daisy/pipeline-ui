import { calculateJobName } from 'shared/jobName'

export function buildMenuTemplate({
    appName,
    jobs,
    onCreateJob,
    onShowSettings,
    onLearnMore,
    onUserGuide,
    onTestIncrement,
    onTestDecrement,
    onNextTab,
    onPrevTab,
    onGotoTab,
}) {
    const isMac = process.platform === 'darwin'

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
                    label: 'New job',
                    click: onCreateJob,
                    accelerator: 'CommandOrControl+N',
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
                    label: 'Next job',
                    click: onNextTab,
                    accelerator: 'Control+Tab',
                },
                {
                    label: 'Previous job',
                    click: onPrevTab,
                    accelerator: 'Control+Shift+Tab',
                },
                ...(jobs.length > 0 ? [{ type: 'separator' }] : []),
                ...(jobs.length > 0
                    ? jobs.map((j, idx) => ({
                          label: `${idx + 1}. ${calculateJobName(j)}`,
                        //   click: onGotoTab(j),
                      }))
                    : []),
                ,
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
