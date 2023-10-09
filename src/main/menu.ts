import { BrowserWindow, dialog, MenuItem } from 'electron'
import { selectStatus } from 'shared/data/slices/pipeline'
import { setClosingMainWindowActionForApp } from 'shared/data/slices/settings'
import { calculateJobName, readableStatus } from 'shared/jobName'
import { Job, JobState, JobStatus, PipelineStatus } from 'shared/types'
import { getPipelineInstance } from './data/middlewares/pipeline'
import { store } from './data/store'
import { closeApplication, MainWindowInstance } from './windows'

export function buildMenuTemplate({
    appName,
    jobs,
    selectedJobId,
    onCreateJob,
    onShowSettings,
    onGetHelp,
    onNextTab,
    onPrevTab,
    onGotoTab,
    onRunJob,
    onRemoveJob,
    onEditJob,
    onShowAbout,
    onImportConfiguration,
}) {
    let pipelineStatus = PipelineStatus.UNKNOWN
    const instance = getPipelineInstance(store.getState())
    if (instance) {
        pipelineStatus = selectStatus(store.getState())
    }

    const isMac = process.platform === 'darwin'

    let multipleJobs = jobs.length > 1
    let status = 'new job'
    let currentJob = jobs.find((j) => j.internalId == selectedJobId)

    if (currentJob?.jobData?.status) {
        status = readableStatus[currentJob.jobData.status]
    }
    if (pipelineStatus != PipelineStatus.RUNNING) {
        status = 'unavailable'
    }

    let canDelete =
        pipelineStatus == PipelineStatus.RUNNING &&
        currentJob &&
        currentJob.state == JobState.SUBMITTED &&
        currentJob.jobData &&
        currentJob.jobData.status != JobStatus.RUNNING &&
        currentJob.jobData.status != JobStatus.IDLE

    let canRun =
        pipelineStatus == PipelineStatus.RUNNING &&
        currentJob &&
        currentJob.state == JobState.NEW &&
        currentJob.jobRequest != null

    let canCreateJob = pipelineStatus == PipelineStatus.RUNNING

    // take off the suffix '- App' -- we only want that to appear on the window title
    let adjustedAppName = appName
        .replace(' - App', '')
        .replace('(2023)', '')
        .trim()

    // @ts-ignore
    const template: MenuItemConstructorOptions = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                  {
                      label: adjustedAppName,
                      submenu: [
                          {
                              label: `About ${adjustedAppName}`,
                              click: onShowAbout,
                          },
                          { type: 'separator' },
                          {
                              label: 'Settings…',
                              click: onShowSettings,
                              accelerator: 'CommandOrControl+,',
                          },
                          { type: 'separator' },
                          { role: 'services' },
                          { type: 'separator' },
                          { role: 'hide', label: `Hide ${adjustedAppName}` },
                          { role: 'hideOthers' },
                          {
                              role: 'unhide',
                              label: `Unhide ${adjustedAppName}`,
                          },
                          { type: 'separator' },
                          {
                              label: `Quit ${adjustedAppName}`,
                              accelerator: 'Command+Q',
                              click: () => {
                                  closeApplication()
                              },
                          },
                      ],
                  },
              ]
            : []),
        {
            label: '&File',
            submenu: [
                {
                    label: 'New job',
                    click: onCreateJob,
                    accelerator: 'CommandOrControl+N',
                    enabled: canCreateJob,
                },
                ...(!isMac
                    ? [
                          {
                              label: 'Settings',
                              click: onShowSettings,
                          },
                      ]
                    : []),
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
                {
                    label: 'Import configuration...',
                    click: () => {
                        onImportConfiguration()
                    },
                },
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
                              label: 'Exit',
                              accelerator: 'Alt+F4',
                              click: (
                                  origin: MenuItem,
                                  window: BrowserWindow,
                                  event: any
                              ) => {
                                  closeApplication()
                              },
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
                { type: 'separator' },
                { role: 'copy' },
                { role: 'paste' },
            ],
        },
        {
            label: '&View',
            submenu: isMac
                ? [
                      { role: 'resetZoom' },
                      { role: 'zoomIn' },
                      { role: 'zoomOut' },
                  ]
                : [
                      {
                          role: 'resetZoom',
                          accelerator: 'Alt+Shift+CommandOrControl+=',
                      },
                      {
                          role: 'zoomIn',
                          accelerator: 'CommandOrControl+=',
                      },
                      {
                          role: 'zoomOut',
                          accelerator: 'Shift+CommandOrControl+=',
                      },
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
                    label: 'Get help',
                    click: () => {
                        onGetHelp()
                    },
                },
                ...(!isMac
                    ? [
                          { type: 'separator' },
                          {
                              label: `About ${adjustedAppName}`,
                              click: onShowAbout,
                          },
                      ]
                    : []),
            ],
        },
    ]

    return template
}
