import { BrowserWindow, dialog, MenuItem } from 'electron'
import { selectPipeline, selectStatus } from 'shared/data/slices/pipeline'
import { calculateJobName, readableStatus } from 'shared/jobName'
import { Job, JobState, JobStatus, PipelineStatus } from 'shared/types'
import { getPipelineInstance } from './data/instance'
import { store } from './data/store'
import { closeApplication } from './windows'
import { selectEditOnNewTab } from 'shared/data/slices/settings'
import { selectDownloadPath } from 'shared/data/slices/settings'
import {
    areAllJobsInBatchDone,
    closeOrCancelLabel,
    getCompletedCountInBatch,
    getIdleCountInBatch,
    getJobsInBatch,
} from 'shared/utils'
import { CanDo } from 'shared/canDo'

export function buildMenuTemplate({
    appName,
    jobs,
    selectedJobId,
    onCreateJob,
    onShowSettings,
    onGotoLink,
    onNextTab,
    onPrevTab,
    onGotoTab,
    onRunJob,
    onRemoveJob,
    onEditJob,
    onShowAbout,
    onCancelBatchJob,
    onResetTextSize,
    onLargerText,
    onSmallerText,
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
    let jobsInBatch = getJobsInBatch(
        selectPipeline(store.getState()),
        currentJob
    )

    if (currentJob?.isPrimaryForBatch) {
        let numJobsDone = getCompletedCountInBatch(currentJob, jobsInBatch)
        status = `Batch status: (${numJobsDone}/${jobsInBatch?.length ?? '?'})`
    } else if (currentJob?.jobData?.status) {
        status = readableStatus[currentJob.jobData.status]
    }
    if (pipelineStatus != PipelineStatus.RUNNING) {
        status = 'unavailable'
    }

    // take off the suffix '- App' -- we only want that to appear on the window title
    let adjustedAppName = appName
        .replace(' - App', '')
        .replace('(2023)', '')
        .trim()
    let submitFormLabel =
        currentJob &&
        currentJob.is2StepsJob &&
        currentJob.stylesheetParameters == null
            ? 'Next'
            : 'Run job'

    
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
                    enabled: CanDo.createJob(pipelineStatus),
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
                    label: submitFormLabel,
                    click: () => {
                        onRunJob(currentJob)
                    },
                    accelerator: 'CommandOrControl+R',
                    enabled: CanDo.runJob(
                        pipelineStatus,
                        currentJob,
                        selectDownloadPath(store.getState())
                    ),
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
                ...(CanDo.closeJob(selectPipeline(store.getState()), currentJob)
                    ? [
                          {
                              label: closeOrCancelLabel(
                                  selectPipeline(store.getState()),
                                  currentJob
                              ),
                              click: () => {
                                  onRemoveJob(currentJob)
                              },
                              accelerator: 'CommandOrControl+D',
                              enabled: true,
                          },
                      ]
                    : [
                          {
                              label: closeOrCancelLabel(
                                  selectPipeline(store.getState()),
                                  currentJob
                              ),
                              click: () => {
                                  if (currentJob?.jobRequest?.batchId) {
                                      if (
                                          getIdleCountInBatch(
                                              currentJob,
                                              jobsInBatch
                                          ) > 0
                                      ) {
                                          onCancelBatchJob(jobsInBatch)
                                      }
                                  } else {
                                      onRemoveJob(currentJob)
                                  }
                              },
                              accelerator: 'CommandOrControl+D',
                              enabled: CanDo.cancelJob(
                                  selectPipeline(store.getState()),
                                  currentJob
                              ),
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
                    enabled: CanDo.editJob(
                        selectPipeline(store.getState()),
                        pipelineStatus,
                        currentJob
                    ),
                },
                { type: 'separator' },
                { role: 'copy' },
                { role: 'paste' },
            ],
        },
        {
            label: '&View',
            submenu: [
                {
                    label: 'Reset Text Size',
                    accelerator: isMac
                        ? 'CommandOrControl+0'
                        : 'Alt+Shift+CommandOrControl+=',
                    click: () => {
                        onResetTextSize()
                    },
                },
                {
                    label: 'Larger Text',
                    accelerator: isMac
                        ? 'CommandOrControl+Plus'
                        : 'CommandOrControl+=',
                    click: () => {
                        onLargerText()
                    },
                },
                {
                    label: 'Smaller Text',
                    accelerator: isMac
                        ? 'CommandOrControl+-'
                        : 'Shift+CommandOrControl+-',
                    click: () => {
                        onSmallerText()
                    },
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
                          .filter(
                              (j: Job) =>
                                  !j.invisible ||
                                  selectEditOnNewTab(store.getState())
                          )
                          .filter(
                              (j: Job) =>
                                  !j.jobRequest?.hasOwnProperty('batchId') ||
                                  (j.jobRequest?.batchId != '' &&
                                      j.isPrimaryForBatch == true)
                          )
                          .map((j: Job, idx: number) => {
                              let menuItem = {
                                  label: `${idx + 1}. ${calculateJobName(
                                      j,
                                      jobs
                                  )}`,
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
                    label: 'Quick start guide',
                    click: () => {
                        onGotoLink(
                            'https://daisy.org/guidance/info-help/guidance-training/daisy-tools/daisy-pipeline-app-quick-start-guide/'
                        )
                    },
                },
                {
                    label: 'Issue tracker',
                    click: () => {
                        onGotoLink('https://github.com/daisy/pipeline/issues')
                    },
                },
                {
                    label: 'Forum',
                    click: () => {
                        onGotoLink(
                            'https://github.com/daisy/pipeline/discussions'
                        )
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
