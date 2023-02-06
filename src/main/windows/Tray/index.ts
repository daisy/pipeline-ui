import { app, Menu, Tray, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { MainWindow } from '../../windows'
import { IPC } from 'shared/constants'
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
    mainWindow: BrowserWindow
    menuBaseTemplate: Array<Electron.MenuItemConstructorOptions> = []
    pipelineMenu: Array<Electron.MenuItemConstructorOptions> = []
    state: PipelineState

    constructor(mainWindow: BrowserWindow) {
        const icon = nativeImage.createFromPath(
            resolveUnpacked('resources', 'icons', 'logo_32x32.png')
        )
        this.tray = new Tray(icon)
        this.mainWindow = mainWindow

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
                    BrowserWindow.getAllWindows().forEach((window) =>
                        window.destroy()
                    )
                    store.dispatch(stop(true))
                    app.quit()
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
        this.tray.on('click', async (e) => {
            try {
                this.mainWindow.show()
            } catch (error) {
                this.mainWindow = await MainWindow()
            }
        })
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
                    try {
                        this.mainWindow.show()
                    } catch (error) {
                        this.mainWindow = await MainWindow()
                    }
                    store.dispatch(selectJob(job))
                    // Note : this triggers a refresh
                    // ENVIRONMENT.IS_DEV
                    //     ? this.mainWindow.loadURL(
                    //           `${APP_CONFIG.RENDERER.DEV_SERVER.URL}#/main`
                    //       )
                    //     : this.mainWindow.loadFile('index.html', {
                    //           hash: `/main`,
                    //       })
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
