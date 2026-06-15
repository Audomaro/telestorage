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
  createGroup: (title: string, isForum = false) => ipcRenderer.invoke('groups:create', title, isForum),
  deleteGroup: (groupId: number) => ipcRenderer.invoke('groups:delete', groupId),
  addToCreatedGroup: (groupId: number) => ipcRenderer.invoke('groups:addToCreated', groupId),
  renameGroup: (groupId: number, title: string) => ipcRenderer.invoke('groups:rename', groupId, title),
  createTopic: (groupId: number, title: string) => ipcRenderer.invoke('groups:createTopic', groupId, title),
  renameTopic: (groupId: number, topicId: number, title: string) => ipcRenderer.invoke('groups:renameTopic', groupId, topicId, title),
  deleteTopic: (groupId: number, topicId: number) => ipcRenderer.invoke('groups:deleteTopic', groupId, topicId),
  getForumTopics: (groupId: number) => ipcRenderer.invoke('groups:getTopics', groupId),
  listFiles: (groupId: number) => ipcRenderer.invoke('files:list', groupId),
  listFilesByTopic: (groupId: number, topicId: number, limit: number, offsetId?: number, search?: string) => ipcRenderer.invoke('files:listByTopic', { groupId, topicId, limit, offsetId, search }),
  uploadFile: (groupId: number, filePath: string, topicId?: number) => ipcRenderer.invoke('files:upload', groupId, filePath, topicId),
  uploadMultipleFiles: (groupId: number, filePaths: string[], topicId?: number) => ipcRenderer.invoke('files:uploadMultiple', groupId, filePaths, topicId),
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
  startVideoStream: (groupId: number, messageId: number, mimeType: string, fileSize: number) =>
    ipcRenderer.invoke('video:startStream', { groupId, messageId, mimeType, fileSize }),
  stopVideoStream: (streamId: string) => ipcRenderer.invoke('video:stopStream', streamId),
  loadMoreFiles: (groupId: number, offsetId?: number, search?: string) => ipcRenderer.invoke('files:listMore', { groupId, offsetId, search }),
  deleteFile: (groupId: number, messageId: number) => ipcRenderer.invoke('files:delete', groupId, messageId),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s: Record<string, unknown>) => ipcRenderer.invoke('settings:set', s),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  pickFiles: () => ipcRenderer.invoke('dialog:pickFiles'),
  uploadTempFile: (groupId: number, fileName: string, data: number[], topicId?: number) =>
    ipcRenderer.invoke('files:uploadTempFile', groupId, fileName, data, topicId),
  uploadFileWithProgress: (groupId: number, filePath: string, topicId: number | undefined, onProgress: (p: number) => void) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const handler = (_event: any, data: any) => {
      if (data.uploadId === uploadId) {
        onProgress(data.progress)
      }
    }
    ipcRenderer.on('files:upload:progress', handler)
    return ipcRenderer.invoke('files:upload:start', { uploadId, groupId, filePath, topicId })
      .finally(() => {
        ipcRenderer.removeListener('files:upload:progress', handler)
      })
  },
  uploadTempFileWithProgress: (groupId: number, fileName: string, data: number[], topicId: number | undefined, onProgress: (p: number) => void) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const handler = (_event: any, data: any) => {
      if (data.uploadId === uploadId) {
        onProgress(data.progress)
      }
    }
    ipcRenderer.on('files:upload:progress', handler)
    return ipcRenderer.invoke('files:uploadTemp:start', { uploadId, groupId, fileName, data, topicId })
      .finally(() => {
        ipcRenderer.removeListener('files:upload:progress', handler)
      })
  },
  showInFolder: (filePath: string) => ipcRenderer.invoke('shell:showInFolder', filePath),
  getLogPath: () => ipcRenderer.invoke('log:getPath'),
  openLogFolder: () => ipcRenderer.invoke('log:open'),
  recordTelemetry: (event: { category: string; name: string; payload?: Record<string, unknown> }) =>
    ipcRenderer.invoke('telemetry:record', event),
  getTelemetry: () => ipcRenderer.invoke('telemetry:get'),
  exportTelemetry: () => ipcRenderer.invoke('telemetry:export'),
  clearTelemetry: () => ipcRenderer.invoke('telemetry:clear'),
  openCrashesFolder: () => ipcRenderer.invoke('shell:openCrashesFolder'),
})
