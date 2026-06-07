import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('telegramAPI', {
  init: () => ipcRenderer.invoke('auth:init'),
  sendCode: (phone: string) => ipcRenderer.invoke('auth:sendCode', phone),
  verifyCode: (phone: string, code: string, codeHash: string) =>
    ipcRenderer.invoke('auth:verifyCode', phone, code, codeHash),
  check2FA: (password: string) => ipcRenderer.invoke('auth:check2FA', password),
  getAuthState: () => ipcRenderer.invoke('auth:getState'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getGroups: () => ipcRenderer.invoke('groups:list'),
  getArchivedGroups: () => ipcRenderer.invoke('groups:listArchived'),
  createGroup: (title: string) => ipcRenderer.invoke('groups:create', title),
  listFiles: (groupId: number) => ipcRenderer.invoke('files:list', groupId),
  uploadFile: (groupId: number, filePath: string) => ipcRenderer.invoke('files:upload', groupId, filePath),
  downloadFile: (groupId: number, messageId: number, filePath: string) =>
    ipcRenderer.invoke('files:download', groupId, messageId, filePath),
  downloadFileWithProgress: (groupId: number, messageId: number, destPath: string, onProgress: (p: number) => void) => {
    const downloadId = `${messageId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const handler = (_event: any, data: any) => {
      if (data.downloadId === downloadId) {
        onProgress(data.progress)
      }
    }
    ipcRenderer.on('files:download:progress', handler)
    return ipcRenderer.invoke('files:download:start', { downloadId, groupId, messageId, destPath })
      .finally(() => {
        ipcRenderer.removeListener('files:download:progress', handler)
      })
  },
  deleteFile: (groupId: number, messageId: number) => ipcRenderer.invoke('files:delete', groupId, messageId),
  forwardFile: (fromGroupId: number, toGroupId: number, messageId: number) =>
    ipcRenderer.invoke('files:forward', fromGroupId, toGroupId, messageId),
})
