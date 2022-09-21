import { app } from 'electron'

import { makeAppSetup, makeAppWithSingleInstanceLock, Pipeline2IPC, registerPipeline2ToIPC, } from './factories'
import { MainWindow, registerAboutWindowCreationByIPC, PipelineTray } from './windows'
import { setupFileDialogEvents } from './fileDialogs'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  const pipelineInstance = new Pipeline2IPC()
  const mainWindow = await makeAppSetup(MainWindow)

  pipelineInstance.launch()
  const tray = new PipelineTray(mainWindow, null, pipelineInstance)

  registerAboutWindowCreationByIPC()
  registerPipeline2ToIPC(pipelineInstance, [mainWindow], tray)
  setupFileDialogEvents()
})
