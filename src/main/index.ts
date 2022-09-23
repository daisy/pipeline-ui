import { app } from 'electron'

import {
  makeAppSetup,
  makeAppWithSingleInstanceLock,
  Pipeline2IPC,
  registerPipeline2ToIPC,
} from './factories'
import {
  MainWindow,
  registerAboutWindowCreationByIPC,
  PipelineTray,
} from './windows'
import { setupFileDialogEvents } from './fileDialogs'
import { IPC } from 'shared/constants'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  const pipelineInstance = new Pipeline2IPC()
  const mainWindow = await makeAppSetup(MainWindow)

  pipelineInstance.launch().then((state) => {
    mainWindow.webContents.send(IPC.PIPELINE.STATE.CHANGED, state)
  })
  const tray = new PipelineTray(mainWindow, null, pipelineInstance)

  registerAboutWindowCreationByIPC()
  registerPipeline2ToIPC(pipelineInstance, [mainWindow], tray)
  setupFileDialogEvents()
})
