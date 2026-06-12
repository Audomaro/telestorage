import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('telegramAPI', {
  init: () => ipcRenderer.invoke('auth:init'),
  sendCode: (phone: string) => ipcRenderer.invoke('auth:sendCode', phone),
  verifyCode: (_phone: string, code: string, _codeHash: string) =>
    ipcRenderer.invoke('auth:verifyCode', code),
  check2FA: (password: string) => ipcRenderer.invoke('auth:check2FA', password),
  getAuthState: () => ipcRenderer.invoke('auth:getState'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getGroups: () => ipcRenderer.invoke('groups:list'),
  getArchivedGroups: () => ipcRenderer.invoke('groups:listArchived'),
  createGroup: (title: string) => ipcRenderer.invoke('groups:create', title),
  deleteGroup: (groupId: number) => ipcRenderer.invoke('groups:delete', groupId),
  addToCreatedGroup: (groupId: number) => ipcRenderer.invoke('groups:addToCreated', groupId),
  listFiles: (groupId: number) => ipcRenderer.invoke('files:list', groupId),
  uploadFile: (groupId: number, filePath: string) => ipcRenderer.invoke('files:upload', groupId, filePath),
  uploadMultipleFiles: (groupId: number, filePaths: string[]) => ipcRenderer.invoke('files:uploadMultiple', groupId, filePaths),
  downloadFile: (groupId: number, messageId: number, filePath: string) =>
    ipcRenderer.invoke('files:download', groupId, messageId, filePath),
  downloadThumbnail: (groupId: number, messageId: number) => ipcRenderer.invoke('files:downloadThumb', groupId, messageId),
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
  downloadPreview: (groupId: number, messageId: number, ext: string, onProgress: (p: number) => void) => {
    const downloadId = `${messageId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const handler = (_event: any, data: any) => {
      if (data.downloadId === downloadId) {
        onProgress(data.progress)
      }
    }
    ipcRenderer.on('files:download:progress', handler)
    return ipcRenderer.invoke('files:downloadPreview', { downloadId, groupId, messageId, ext })
      .finally(() => {
        ipcRenderer.removeListener('files:download:progress', handler)
      })
  },
  loadMoreFiles: (groupId: number, offsetId?: number, search?: string) => ipcRenderer.invoke('files:listMore', { groupId, offsetId, search }),
  deleteFile: (groupId: number, messageId: number) => ipcRenderer.invoke('files:delete', groupId, messageId),
  forwardFile: (fromGroupId: number, toGroupId: number, messageId: number) =>
    ipcRenderer.invoke('files:forward', fromGroupId, toGroupId, messageId),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s: Record<string, unknown>) => ipcRenderer.invoke('settings:set', s),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  pickFiles: () => ipcRenderer.invoke('dialog:pickFiles'),
  uploadTempFile: (groupId: number, fileName: string, data: number[]) =>
    ipcRenderer.invoke('files:uploadTempFile', groupId, fileName, data),
  showInFolder: (filePath: string) => ipcRenderer.invoke('shell:showInFolder', filePath),
})
