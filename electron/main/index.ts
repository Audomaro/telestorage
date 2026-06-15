import { config } from 'dotenv'
import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import log from 'electron-log/main'

const prodEnvPath = join(process.resourcesPath, '.env')
const devEnvPath = join(process.cwd(), '.env')
config({ path: existsSync(prodEnvPath) ? prodEnvPath : devEnvPath })

import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc'
import { initMonitoring, recordTelemetry, flushTelemetry } from './monitoring'

log.initialize({ preload: true })
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

initMonitoring()
recordTelemetry({ category: 'lifecycle', name: 'app:started' })

function createWindow() {
  const mainWindow = new BrowserWindow({
    show: false,
    title: 'TeleStorage',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowFileAccess: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  recordTelemetry({ category: 'lifecycle', name: 'app:ready' })
  Menu.setApplicationMenu(null)
  await registerIpcHandlers()
  createWindow()

  if (app.isPackaged) {
    recordTelemetry({ category: 'lifecycle', name: 'update:check-started' })
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      recordTelemetry({ category: 'lifecycle', name: 'update:check-failed' })
      log.warn('Auto-updater check failed:', err)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  recordTelemetry({ category: 'lifecycle', name: 'app:quit' })
  flushTelemetry()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
