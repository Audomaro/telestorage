import { ipcMain } from 'electron'
import { initClient, startClient, startPhoneAuth, verifyPhoneCode, verify2FAPassword, getAuthState, getSession, logout, setLoggedIn } from './telegram/auth'
import { saveSession, loadSession, clearSession } from './telegram/storage'
import { getGroups, getArchivedGroups, createGroup } from './telegram/groups'

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
}
