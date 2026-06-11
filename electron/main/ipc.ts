import { ipcMain, dialog, app } from 'electron'
import { join } from 'path'
import { initClient, startClient, startPhoneAuth, verifyPhoneCode, verify2FAPassword, getAuthState, getSession, logout, setLoggedIn } from './telegram/auth'
import { saveSession, loadSession, clearSession } from './telegram/storage'
import { getGroups, getArchivedGroups, createGroup, deleteGroup } from './telegram/groups'
import { listFiles, uploadFile, downloadFile, downloadFileWithProgress, deleteFile, forwardFile } from './telegram/files'
import { getSettings, setSettings, AppSettings } from './telegram/settings'

export function registerIpcHandlers(): void {
  ipcMain.handle('auth:init', async () => {
    const session = loadSession()
    try {
      await initClient(session || undefined)
      await startClient()
      if (session) {
        setLoggedIn(true)
        return { initialized: true }
      }
      return { initialized: false }
    } catch (err: any) {
      console.error('auth:init error:', err.message)
      return { initialized: false, error: err.message }
    }
  })

  ipcMain.handle('auth:sendCode', async (_event, phone: string) => {
    return startPhoneAuth(phone)
  })

  ipcMain.handle('auth:verifyCode', async (_event, phone: string, code: string, codeHash: string) => {
    const result = await verifyPhoneCode(code)
    if (!result.needs2FA) {
      saveSession(getSession())
    }
    return result
  })

  ipcMain.handle('auth:check2FA', async (_event, password: string) => {
    await verify2FAPassword(password)
    saveSession(getSession())
  })

  ipcMain.handle('auth:getState', () => {
    return getAuthState()
  })

  ipcMain.handle('auth:logout', async () => {
    await logout()
    clearSession()
  })

  ipcMain.handle('groups:list', async () => {
    return getGroups()
  })

  ipcMain.handle('groups:listArchived', async () => {
    return getArchivedGroups()
  })

  ipcMain.handle('groups:create', async (_event, title: string) => {
    return createGroup(title)
  })

  ipcMain.handle('groups:delete', async (_event, groupId: number) => {
    return deleteGroup(groupId)
  })

  ipcMain.handle('files:list', async (_event, groupId: number) => {
    return listFiles(groupId)
  })

  ipcMain.handle('files:upload', async (_event, groupId: number, filePath: string) => {
    return uploadFile(groupId, filePath)
  })

  ipcMain.handle('files:download', async (_event, groupId: number, messageId: number, filePath: string) => {
    return downloadFile(groupId, messageId, filePath)
  })

  ipcMain.handle('files:download:start', async (event, { downloadId, groupId, messageId, destPath }) => {
    return downloadFileWithProgress(groupId, messageId, destPath, (progress) => {
      event.sender.send('files:download:progress', { downloadId, progress })
    })
  })

  ipcMain.handle('files:delete', async (_event, groupId: number, messageId: number) => {
    return deleteFile(groupId, messageId)
  })

  ipcMain.handle('files:forward', async (_event, fromGroupId: number, toGroupId: number, messageId: number) => {
    return forwardFile(fromGroupId, toGroupId, messageId)
  })

  ipcMain.handle('files:downloadPreview', async (event, { downloadId, groupId, messageId, ext = '' }) => {
    const tmpDir = app.getPath('temp')
    const destPath = join(tmpDir, 'teledrive', `${messageId}_preview${ext}`)
    return downloadFileWithProgress(groupId, messageId, destPath, (progress) => {
      event.sender.send('files:download:progress', { downloadId, progress })
    })
  })

  ipcMain.handle('settings:get', async () => {
    return getSettings()
  })

  ipcMain.handle('settings:set', async (_event, partial: Partial<AppSettings>) => {
    return setSettings(partial)
  })

  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
}
