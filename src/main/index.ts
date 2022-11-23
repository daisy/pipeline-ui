import {
    app,
    BrowserWindow,
    Menu,
    MenuItemConstructorOptions,
    shell,
} from 'electron'

import { error } from 'electron-log'

import {
    bindWindowToPipeline,
    makeAppSetup,
    makeAppWithSingleInstanceLock,
    Pipeline2IPC,
    registerPipeline2ToIPC,
} from './factories'

import {
    MainWindow,
    PipelineTray,
    registerAboutWindowCreationByIPC,
    registerSettingsWindowCreationByIPC,
} from './windows'

import { setupFileDialogEvents } from './fileDialogs'
import { IPC } from 'shared/constants'
import { setupShowInFolderEvents } from './folder'

makeAppWithSingleInstanceLock(async () => {
    await app.whenReady()
    const pipelineInstance = new Pipeline2IPC()
    const mainWindow = await makeAppSetup(MainWindow)

    let tray: PipelineTray = null
    try {
        pipelineInstance
            .launch()
            .then((state) => {
                mainWindow.webContents.send(IPC.PIPELINE.STATE.CHANGED, state)
            })
            .catch((err) => {
                error(err)
                throw err
            })
        tray = new PipelineTray(mainWindow, pipelineInstance)
    } catch (err) {
        error(err)
        // quit app for now but we might need to think for a better handling for the user
        app.quit()
    }
    registerSettingsWindowCreationByIPC()
    registerAboutWindowCreationByIPC()
    registerPipeline2ToIPC(pipelineInstance)
    bindWindowToPipeline(mainWindow, pipelineInstance)
    setupFileDialogEvents()
    setupShowInFolderEvents()
    const isMac = process.platform === 'darwin'

    // Template taken from electron documentation
    // To be completed
    const template: MenuItemConstructorOptions = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                  {
                      label: app.name,
                      submenu: [
                          { label: 'Create a new job' },
                          { type: 'separator' },
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
            submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
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
            role: 'help',
            submenu: [
                {
                    label: 'Learn more',
                    click: async () => {
                        await shell.openExternal(
                            'https://daisy.github.io/pipeline/'
                        )
                    },
                },
                {
                    label: 'User guide',
                    click: async () => {
                        await shell.openExternal(
                            'https://daisy.github.io/pipeline/Get-Help/'
                        )
                    },
                },
            ],
        },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
})
