import { app, ipcMain, Menu, shell } from 'electron'

import { buildMenuTemplate } from './menu'
import { store } from './data/store'
import { MainWindow } from './windows'
import { showMessageBoxYesNo } from './ipcs/messageBox'
import { IPC } from 'shared/constants'
import {
    save,
    selectEditOnNewTab,
    setTextSize,
} from 'shared/data/slices/settings'
import {
    addJob,
    editJob,
    newJob,
    removeJob,
    selectJob,
    selectPipeline,
    selectNextJob,
    selectPrevJob,
} from 'shared/data/slices/pipeline'
import { DefaultTextSize, TextSizeOptions } from 'shared/types'

let lastMenuSignature: string | null = null

export function buildApplicationMenu() {
    const menuSignature = getMenuSignature()
    if (menuSignature === lastMenuSignature) {
        return
    }

    let jobs = selectPipeline(store.getState()).jobs

    //@ts-ignore
    let template = buildMenuTemplate({
        appName: app.name,
        jobs,
        selectedJobId: selectPipeline(store.getState()).selectedJobId,
        onCreateJob: async () => {
            const job = newJob(selectPipeline(store.getState()))
            store.dispatch(addJob(job))
            store.dispatch(selectJob(job))
            MainWindow().then((window) => {
                if (window.isMinimized()) {
                    window.restore()
                }
                window.focus()
            })
        },
        onShowSettings: async () => {
            ipcMain.emit(IPC.WINDOWS.SETTINGS.CREATE)
        },
        onGotoLink: async (link) => {
            await shell.openExternal(link)
        },
        onNextTab: async () => {
            store.dispatch(selectNextJob(selectEditOnNewTab(store.getState())))
        },
        onPrevTab: async () => {
            store.dispatch(selectPrevJob(selectEditOnNewTab(store.getState())))
        },
        onGotoTab: async (job) => {
            store.dispatch(selectJob(job))
        },
        onRunJob: async () => {
            MainWindow().then((w) => w.webContents.send('submit-script-form'))
        },
        onRemoveJob: async (job) => {
            let result = showMessageBoxYesNo(
                'Are you sure you want to close this job?'
            )
            if (result) {
                store.dispatch(removeJob(job))
            }
        },
        onEditJob: async (job) => {
            store.dispatch(editJob(job))
        },
        onShowAbout: async () => {
            ipcMain.emit(IPC.WINDOWS.ABOUT.CREATE)
        },
        onResetTextSize: () => {
            store.dispatch(setTextSize(DefaultTextSize))
            store.dispatch(save())
        },
        onLargerText: () => {
            let textSize = store.getState().settings.textSize
            let textSizeIndex = TextSizeOptions.findIndex(
                (opt) => opt == textSize
            )
            if (textSizeIndex < TextSizeOptions.length - 1) {
                store.dispatch(setTextSize(TextSizeOptions[textSizeIndex + 1]))
                store.dispatch(save())
            }
        },
        onSmallerText: () => {
            let textSize = store.getState().settings.textSize
            let textSizeIndex = TextSizeOptions.findIndex(
                (opt) => opt == textSize
            )
            if (textSizeIndex > 0) {
                store.dispatch(setTextSize(TextSizeOptions[textSizeIndex - 1]))
                store.dispatch(save())
            }
        },
    })
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    lastMenuSignature = menuSignature
}

function getMenuSignature() {
    const state = store.getState()
    const pipeline = selectPipeline(state)
    const settings = state.settings

    // Job monitoring dispatches frequently; only rebuild the native menu when
    // state used by the menu template has changed.
    return JSON.stringify({
        appName: app.name,
        downloadFolder: settings.downloadFolder,
        editJobOnNewTab: settings.editJobOnNewTab,
        pipelineStatus: pipeline.status,
        selectedJobId: pipeline.selectedJobId,
        jobs: pipeline.jobs.map((job) => ({
            internalId: job.internalId,
            invisible: job.invisible,
            state: job.state,
            status: job.jobData?.status,
            jobRequestError: Boolean(job.jobRequestError),
            jobRequestName: job.jobRequest?.nicename,
            jobDataName: job.jobData?.nicename,
            hasJobRequest: Boolean(job.jobRequest),
            requiredInvalid:
                job.jobRequest?.validation?.some(
                    (v) => v.required && !v.validValue
                ) ?? false,
            is2StepsJob: job.is2StepsJob,
            stylesheetParametersPending:
                job.is2StepsJob && job.stylesheetParameters == null,
        })),
    })
}
