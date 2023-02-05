import { calculateJobName } from 'shared/jobName'
import { JobState, JobStatus } from 'shared/types'

export function buildMenuTemplate({
    appName,
    jobs,
    selectedJobId,
    onCreateJob,
    onShowSettings,
    onLearnMore,
    onUserGuide,
    onNextTab,
    onPrevTab,
    onGotoTab,
    onRunJob,
    onRemoveJob,
}) {
    const isMac = process.platform === 'darwin'

    let multipleJobs = jobs.length > 1

    let currentJob = jobs.find((j) => j.internalId == selectedJobId)

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
                {
                    label: 'Run job',
                    click: () => {
                        onRunJob(currentJob)
                    },
                    accelerator: 'CommandOrControl+R',
                    enabled:
                        currentJob &&
                        currentJob.state == JobState.NEW &&
                        currentJob.jobRequest != null,
                },
                ...(currentJob && currentJob.state == JobState.SUBMITTED
                    ? [
                          {
                              label: 'Delete job',
                              click: () => {
                                  onRemoveJob(currentJob)
                              },
                              accelerator: 'CommandOrControl+Delete',
                              enabled:
                                  currentJob?.state == JobState.SUBMITTED &&
                                  currentJob.status != JobStatus.RUNNING &&
                                  currentJob.status != JobStatus.IDLE,
                          },
                      ]
                    : [
                          {
                              label: 'Cancel job',
                              click: () => {
                                  onRemoveJob(currentJob)
                              },
                              accelerator: 'CommandOrControl+Delete',
                              enabled:
                                  currentJob &&
                                  currentJob.state == JobState.NEW &&
                                  currentJob.jobRequest != null,
                          },
                      ]),

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
                    click: () => {
                        onNextTab()
                    },
                    accelerator: 'Control+Tab',
                    enabled: multipleJobs,
                },
                {
                    label: 'Previous job',
                    click: () => {
                        onPrevTab()
                    },
                    accelerator: 'Control+Shift+Tab',
                    enabled: multipleJobs,
                },
                ...(jobs.length > 0 ? [{ type: 'separator' }] : []),
                ...(jobs.length > 0
                    ? jobs.map((j, idx) => {
                          let menuItem = {
                              label: `${idx + 1}. ${calculateJobName(j)}`,
                              click: () => onGotoTab(j),
                          }
                          if (idx < 10) {
                              menuItem['accelerator'] = `CommandOrControl+${
                                  (idx % 10) + 1 != 10 ? (idx % 10) + 1 : 0
                              }`
                          }
                          return menuItem
                      })
                    : []),
                ,
            ],
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn more',
                    click: () => {
                        onLearnMore()
                    },
                },
                {
                    label: 'User guide',
                    click: () => {
                        onUserGuide()
                    },
                },
            ],
        },
    ]

    return template
}
