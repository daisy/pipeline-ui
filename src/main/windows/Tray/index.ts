import { app, Menu, Tray, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { closeApplication, MainWindow } from 'main/windows'
import { IPC, PLATFORM } from 'shared/constants'
import { PipelineState, PipelineStatus } from 'shared/types'
import { resolveUnpacked } from 'shared/utils'
import { store } from 'main/data/store'
import {
    addJob,
    newJob,
    selectJob,
    selectPipeline,
    start,
    stop,
} from 'shared/data/slices/pipeline'
import { getPipelineInstance } from 'main/data/middlewares/pipeline'

export class PipelineTray {
    tray: Tray
    menuBaseTemplate: Array<Electron.MenuItemConstructorOptions> = []
    pipelineMenu: Array<Electron.MenuItemConstructorOptions> = []
    state: PipelineState

    constructor() {
        const icon = nativeImage.createFromPath(
            resolveUnpacked('resources', 'icons', PLATFORM.IS_MAC ? 'logo_mac_40x40_Template.png' : 'logo_32x32.png')
        )
        this.tray = new Tray(icon)

        const instance = getPipelineInstance(store.getState())
        this.menuBaseTemplate = [
            // Note : uncomment if we want those window
            // {
            //     label: 'About',
            //     click: async (item, window, event) => {
            //         ipcMain.emit(IPC.WINDOWS.ABOUT.CREATE)
            //     },
            // },
            {
                label: 'Settings',
                click: async (item, window, event) => {
                    ipcMain.emit(IPC.WINDOWS.SETTINGS.CREATE)
                },
            },
            {
                label: 'Quit',
                click: (item, window, event) => {
                    closeApplication()
                },
            },
        ]

        if (instance) {
            this.state = selectPipeline(store.getState())
            const unsubscibe = store.subscribe(() => {
                let newState = selectPipeline(store.getState())
                if (newState != this.state) {
                    this.state = newState
                    this.refreshElectronTray()
                }
            })
            this.refreshElectronTray()
            app.on('before-quit', (event) => {
                unsubscibe()
            })
        } else {
            this.pipelineMenu = [
                {
                    label: 'Pipeline could not be launched',
                    enabled: false,
                },
            ]
            this.tray.setToolTip('DAISY Pipeline 2')
            this.tray.setContextMenu(
                Menu.buildFromTemplate([
                    ...this.pipelineMenu,
                    ...this.menuBaseTemplate,
                ])
            )
        }
        if (!PLATFORM.IS_MAC) {
            this.tray.on('click', async (e) => {
                MainWindow().then((window) => {
                    if (window.isMinimized()) {
                        window.restore()
                    }
                    window.focus()
                })
            })
        }
    }

    /**
     * refresh the tray
     */
    refreshElectronTray() {
        const state = store.getState()
        const pipelineState = selectPipeline(state)
        this.pipelineMenu = [
            {
                label:
                    pipelineState.status == PipelineStatus.STOPPED
                        ? 'Start the engine'
                        : `Engine is ${pipelineState.status}${
                              pipelineState.webservice
                                  ? ' on port ' + pipelineState.webservice.port
                                  : ''
                          }`,
                enabled: pipelineState.status == PipelineStatus.STOPPED,
                click: async (item, window, event) => store.dispatch(start()),
            },
            {
                label: 'New job',
                enabled: pipelineState.status == PipelineStatus.RUNNING,
                click: async (item, window, event) => {
                    const job = newJob(selectPipeline(store.getState()))
                    store.dispatch(addJob(job))
                    MainWindow().then((window) => {
                        if (window.isMinimized()) {
                            window.restore()
                        }
                        window.focus()
                    })
                    store.dispatch(selectJob(job))
                },
            },
        ]
        this.tray.setToolTip(`DAISY Pipeline 2`)
        // Update tray
        this.tray.setContextMenu(
            Menu.buildFromTemplate([
                ...this.pipelineMenu,
                ...this.menuBaseTemplate,
            ])
        )
    }
}
