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
  let tray = null
  try {
    pipelineInstance.launch().then((state) => {
      mainWindow.webContents.send(IPC.PIPELINE.STATE.CHANGED, state)
    })
  
    tray = new PipelineTray(mainWindow, null, pipelineInstance)
  } catch (error) {
    console.log(error)
  }
  

  registerAboutWindowCreationByIPC()
  registerPipeline2ToIPC(pipelineInstance, [mainWindow], tray)
  setupFileDialogEvents()
})
