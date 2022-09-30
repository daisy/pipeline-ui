import { ipcMain, dialog, BrowserWindow, shell } from 'electron'

import { info } from 'electron-log'

// helper functions
const {
  eventEmmitter,
  IPC_EVENT_showItemInFolder,
  IPC_EVENT_showReportFileBrowseDialog,
  IPC_EVENT_showExportReportDialog,
  IPC_EVENT_showFolderBrowseDialog,
  IPC_EVENT_showEpubFileOrFolderBrowseDialog,
  IPC_EVENT_showEpubFileBrowseDialog,
  IPC_EVENT_showEpubFolderBrowseDialog,
} = require('../shared/main-renderer-events')

// Providing the "localization" keys manually since the borrowed code in this file wants them
let localizationStrings = {
  'dialog.choosedir': 'Choose directory',
  'dialog.select': 'Select',
  'dialog.allfiles': 'All files',
  'dialog.chooseepub': 'Choose EPUB',
  'dialog.check': 'Select',
  'dialog.chooseepubfile': 'Choose EPUB file',
  'dialog.chooseepubdir': 'Choose EPUB directory',
}
let localize = (key) => localizationStrings[key] ?? ''

const showFolderBrowseDialog = async (callback) => {
  const filePath = await showOpenDialog({
    title: localize('dialog.choosedir'),
    buttonLabel: localize('dialog.select'),
    properties: ['openDirectory', 'createDirectory'],
    filters: [{ name: localize('dialog.allfiles'), extensions: ['*'] }],
  })
  if (callback && filePath) {
    callback(filePath)
  }
}

const showEpubFileOrFolderBrowseDialog = async (callback) => {
  info('main process file or folder dialog')
  const filePath = await showOpenDialog({
    title: localize('dialog.chooseepub'),
    buttonLabel: localize('dialog.check'),
    properties: ['openFile'],
    //filters: [{name: 'EPUB', extensions: ['epub']}, {name: localize("dialog.allfiles"), extensions: ['*']}],
  })
  if (callback && filePath) {
    callback(filePath)
  }
}

const showEpubFileBrowseDialog = async (callback) => {
  const filePath = await showOpenDialog({
    title: localize('dialog.chooseepubfile'),
    buttonLabel: localize('dialog.check'),
    properties: ['openFile'],
    filters: [
      { name: 'EPUB', extensions: ['epub'] },
      { name: localize('dialog.allfiles'), extensions: ['*'] },
    ],
  })
  if (callback && filePath) {
    callback(filePath)
  }
}

const showEpubFolderBrowseDialog = async (callback) => {
  const filePath = await showOpenDialog({
    title: localize('dialog.chooseepubdir'),
    buttonLabel: localize('dialog.check'),
    properties: ['openDirectory'],
    filters: [{ name: localize('dialog.allfiles'), extensions: ['*'] }],
  })
  if (callback && filePath) {
    callback(filePath)
  }
}

const showReportFileBrowseDialog = async (callback) => {
  const filePath = await showOpenDialog({
    title: localize('dialog.choosereport'),
    buttonLabel: localize('dialog.open'),
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: localize('dialog.allfiles'), extensions: ['*'] },
    ],
  })
  if (callback && filePath) {
    callback(filePath)
  }
}

function setupFileDialogEvents() {
  //  event.sender is Electron.WebContents
  //  const win = BrowserWindow.fromWebContents(event.sender) || undefined;
  //  const webcontent = webContents.fromId(payload.webContentID); // webcontents.id is identical

  ipcMain.on(IPC_EVENT_showItemInFolder, (event, payload) => {
    //  event.sender is Electron.WebContents
    //  const win = BrowserWindow.fromWebContents(event.sender) || undefined;
    //  const webcontent = webContents.fromId(payload.webContentID); // webcontents.id is identical

    info('showItemInFolder', 'ipcMain', payload.path)
    shell.showItemInFolder(payload.path)
  })

  // comes from the renderer process (ipcRenderer.send())
  ipcMain.on(IPC_EVENT_showEpubFolderBrowseDialog, async (event, payload) => {
    await showEpubFolderBrowseDialog((filePath) => {
      info('showEpubFolderBrowseDialog', 'ipcMain: ', filePath)
      event.sender.send(IPC_EVENT_showEpubFolderBrowseDialog, filePath)
    })
  })

  // comes from the renderer process (ipcRenderer.send())
  ipcMain.on(IPC_EVENT_showEpubFileBrowseDialog, async (event, payload) => {
    await showEpubFileBrowseDialog((filePath) => {
      info('showEpubFileBrowseDialog', 'ipcMain: ', filePath)
      event.sender.send(IPC_EVENT_showEpubFileBrowseDialog, filePath)
    })
  })

  // comes from the renderer process (ipcRenderer.send())
  ipcMain.on(
    IPC_EVENT_showEpubFileOrFolderBrowseDialog,
    async (event, payload) => {
      info('hi from IPC_EVENT received by main')
      await showEpubFileOrFolderBrowseDialog((filePath) => {
        info('showEpubFileOrFolderBrowseDialog', 'ipcMain: ', filePath)
        event.sender.send(IPC_EVENT_showEpubFileOrFolderBrowseDialog, filePath)
      })
    }
  )

  // comes from the renderer process (ipcRenderer.send())
  ipcMain.on(IPC_EVENT_showFolderBrowseDialog, async (event, payload) => {
    await showFolderBrowseDialog((filePath) => {
      info('showFolderBrowseDialog', 'ipcMain: ', filePath)
      event.sender.send(IPC_EVENT_showFolderBrowseDialog, filePath)
    })
  })
}
export {
  setupFileDialogEvents,
  showEpubFolderBrowseDialog,
  showEpubFileBrowseDialog,
  showEpubFileOrFolderBrowseDialog,
  showFolderBrowseDialog,
}

async function showOpenDialog(options) {
  const res = await dialog.showOpenDialog(
    BrowserWindow ? BrowserWindow.getFocusedWindow() : undefined,
    options
  )
  if (res.canceled || !res.filePaths || !res.filePaths.length) {
    return undefined
  }
  const filePath = res.filePaths[0]
  if (filePath) {
    return filePath
  } else {
    return undefined
  }
}

async function showSaveDialog(options) {
  const res = await dialog.showSaveDialog(
    BrowserWindow ? BrowserWindow.getFocusedWindow() : undefined,
    options
  )
  if (res.canceled || !res.filePath) {
    return undefined
  }
  return res.filePath
}
