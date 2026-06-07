import { ipcMain } from 'electron'
import { initClient, startClient, sendPhoneCode, verifyCode, check2FA, getAuthState, getSession, logout, setLoggedIn } from './telegram/auth'
import { saveSession, loadSession, clearSession } from './telegram/storage'

export function registerIpcHandlers(): void {
  ipcMain.handle('auth:init', async () => {
    const session = loadSession()
    await initClient(session || undefined)
    try {
      await startClient()
      if (session) {
        setLoggedIn(true)
        return { initialized: true }
      }
    } catch {
      // Need to re-authenticate
    }
    return { initialized: false }
  })

  ipcMain.handle('auth:sendCode', async (_event, phone: string) => {
    return sendPhoneCode(phone)
  })

  ipcMain.handle('auth:verifyCode', async (_event, phone: string, code: string, codeHash: string) => {
    const result = await verifyCode(phone, code, codeHash)
    if (!result.needs2FA) {
      saveSession(getSession())
    }
    return result
  })

  ipcMain.handle('auth:check2FA', async (_event, password: string) => {
    await check2FA(password)
    saveSession(getSession())
  })

  ipcMain.handle('auth:getState', () => {
    return getAuthState()
  })

  ipcMain.handle('auth:logout', async () => {
    await logout()
    clearSession()
  })
}
