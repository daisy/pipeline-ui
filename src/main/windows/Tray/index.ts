import { app, Menu, Tray, BrowserWindow, ipcMain, ipcRenderer } from 'electron'
import { APP_CONFIG } from '~/app.config'
import { resolve } from 'path'
import {
  makeAppSetup,
  makeAppWithSingleInstanceLock,
  Pipeline2IPC,
} from '../../factories'
import { MainWindow, AboutWindow } from '../../windows'
import { IPC } from 'shared/constants'
import { PipelineState, PipelineStatus } from 'shared/types'

export class PipelineTray {
  tray: Tray
  mainWindow: BrowserWindow
  pipeline?: Pipeline2IPC = null
  menuBaseTemplate = []
  pipelineMenu = null

  constructor(
    mainWindow: BrowserWindow,
    aboutWindow?: BrowserWindow,
    pipeline?: Pipeline2IPC
  ) {
    this.tray = new Tray(
      resolve(APP_CONFIG.FOLDERS.RESOURCES, 'icons', 'icon.ico')
    )

    this.menuBaseTemplate = [
      {
        label: 'Open UI',
        click: async (item, window, event) => {
          if (!mainWindow) {
            mainWindow = await makeAppSetup(MainWindow)
          }
          mainWindow.show()
        },
      },
      {
        label: 'About',
        click: (item, window, event) => {
          if (!aboutWindow) {
            aboutWindow = AboutWindow()
          }
          aboutWindow.show()
        },
      },
    ]

    if (pipeline) {
      this.bindToPipeline(pipeline)
    } else {
      this.pipelineMenu = [
        {
          label: 'No pipeline installation found',
        },
        {
          label: 'Quit',
          click: (item, window, event) => {
            BrowserWindow.getAllWindows().forEach((window) => window.destroy())
            app.quit()
          },
        },
      ]
      this.tray.setToolTip('DAISY Pipeline 2')
      this.tray.setContextMenu(
        Menu.buildFromTemplate([...this.menuBaseTemplate, ...this.pipelineMenu])
      )
    }
  }

  /**
   * Bind a pipeline instance to the tray to allow interactions
   * @param pipeline
   */
  bindToPipeline(pipeline: Pipeline2IPC) {
    // setup listeners to update tray based on states
    pipeline.registerListener((newState) =>
      this.updateElectronTray(newState, pipeline)
    )
    this.updateElectronTray(pipeline.state, pipeline)
  }

  /**
   * Update the tray based on a given pipeline state
   * @param newState State to use for tray configuration
   * @param pipeline pipeline instance to be controled by the tray actions
   */
  updateElectronTray(newState: PipelineState, pipeline: Pipeline2IPC) {
    this.pipelineMenu = [
      {
        label:
          newState.status == PipelineStatus.RUNNING
            ? 'Stop the pipeline'
            : 'Start the pipeline',
        click: (item, window, event) => {
          newState.status == PipelineStatus.RUNNING
            ? pipeline.stop()
            : pipeline.launch()
        },
      },
      {
        label: 'Quit',
        click: (item, window, event) => {
          BrowserWindow.getAllWindows().forEach((window) => window.destroy())
          pipeline.stop()
          app.quit()
        },
      },
    ]
    this.tray.setToolTip('DAISY Pipeline 2 - ' + newState.status)
    // Update tray
    this.tray.setContextMenu(
      Menu.buildFromTemplate([...this.menuBaseTemplate, ...this.pipelineMenu])
    )
  }
}
