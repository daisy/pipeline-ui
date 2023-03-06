import { BrowserWindow, dialog, MenuItem } from 'electron'
import { calculateJobName, readableStatus } from 'shared/jobName'
import { Job, JobState, JobStatus } from 'shared/types'

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
    onEditJob,
}) {
    const isMac = process.platform === 'darwin'

    let multipleJobs = jobs.length > 1

    let currentJob = jobs.find((j) => j.internalId == selectedJobId)
    let status = currentJob?.jobData
        ? readableStatus[currentJob.jobData.status]
        : `new job`

    let canDelete =
        currentJob &&
        currentJob.state == JobState.SUBMITTED &&
        currentJob.jobData &&
        currentJob.jobData.status != JobStatus.RUNNING &&
        currentJob.jobData.status != JobStatus.IDLE

    let canCancel = currentJob && currentJob.state == JobState.NEW

    let canRun =
        currentJob &&
        currentJob.state == JobState.NEW &&
        currentJob.jobRequest != null

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
            label: '&File',
            submenu: [
                {
                    label: 'New job',
                    click: onCreateJob,
                    accelerator: 'CommandOrControl+N',
                },
                {
                    label: 'Settings',
                    click: onShowSettings,
                    accelerator: isMac ? 'CommandOrControl+,' : '',
                },
                { type: 'separator' },
                {
                    label: 'Run job',
                    click: () => {
                        onRunJob(currentJob)
                    },
                    accelerator: 'CommandOrControl+R',
                    enabled: canRun,
                },
                ...(currentJob
                    ? [
                          {
                              label: `Status: ${status}`,
                              accelerator: 'CommandOrControl+Shift+I',
                              click: async () => {
                                  await dialog.showMessageBox({
                                      type: 'info',
                                      message: `Status: ${status}`,
                                  })
                              },
                          },
                      ]
                    : []),
                ...(currentJob && currentJob.state == JobState.SUBMITTED
                    ? [
                          {
                              label: 'Close job',
                              click: () => {
                                  onRemoveJob(currentJob)
                              },
                              accelerator: 'CommandOrControl+D',
                              enabled: canDelete,
                          },
                      ]
                    : [
                          {
                              label: 'Cancel job',
                              click: () => {
                                  onRemoveJob(currentJob)
                              },
                              accelerator: 'CommandOrControl+D',
                          },
                      ]),

                { type: 'separator' },
                {
                    label: 'Close window',
                    accelerator: 'CommandOrControl+W',
                    click: (
                        origin: MenuItem,
                        window: BrowserWindow,
                        event: any
                    ) => {
                        window.close()
                    },
                },
                ...(!isMac
                    ? [
                          {
                              role: 'quit',
                              accelerator: 'Alt+F4',
                          },
                      ]
                    : []),
            ],
        },
        {
            label: '&Edit',
            submenu: [
                {
                    label: 'Edit job',
                    click: () => {
                        onEditJob(currentJob)
                    },
                    accelerator: 'CommandOrControl+E',
                    enabled: canDelete,
                },
                { role: 'separator' },
                { role: 'copy' },
                { role: 'paste' },
            ],
        },
        {
            label: '&View',
            submenu: [
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
            ],
        },
        {
            label: '&Goto',
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
                    ? jobs
                          .filter((j: Job) => !j.invisible)
                          .map((j: Job, idx: number) => {
                              let menuItem = {
                                  label: `${idx + 1}. ${calculateJobName(j)}`,
                                  click: () => onGotoTab(j),
                              }
                              if (idx < 10) {
                                  menuItem[
                                      'accelerator'
                                  ] = `CommandOrControl+Alt+${
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
            label: '&Help',
            submenu: [
                {
                    label: 'Learn more',
                    click: () => {
                        onLearnMore()
                    },
                },
                {
                    label: 'User guide',
                    accelerator: isMac ? 'Shift+Cmd+?' : 'Alt+F1',
                    click: () => {
                        onUserGuide()
                    },
                },
            ],
        },
    ]

    return template
}
