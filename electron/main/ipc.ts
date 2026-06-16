import { ipcMain, dialog, app, shell } from 'electron'
import log from 'electron-log/main'
import { join } from 'path'
import { stat, mkdir, writeFile, unlink } from 'fs/promises'
import { initClient, startClient, startPhoneAuth, verifyPhoneCode, verify2FAPassword, getAuthState, getSession, logout, setLoggedIn, getClient } from './telegram/auth'
import { saveSession, loadSession, clearSession } from './telegram/storage'
import { getGroups, getArchivedGroups, createGroup, deleteGroup, getForumTopics, renameGroup, renameForumTopic, createForumTopic, deleteForumTopic } from './telegram/groups'
import { listFiles, listFilesBatch, listFilesByTopic, uploadFile, uploadMultipleFiles, uploadFileWithProgress, downloadFile, downloadFileWithProgress, downloadThumbnail, deleteFile } from './telegram/files'
import { startStreamServer, registerStream, unregisterStream, getStreamServerPort } from './streamServer'
import { getSettings, setSettings, addCreatedGroupId, AppSettings } from './telegram/settings'
import { recordTelemetry, getTelemetryEvents, exportTelemetry, clearTelemetry } from './monitoring'
import type { TelemetryCategory, TelemetryEvent } from './monitoring/types'

function getMimeCategory(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio'
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document'
  return 'other'
}

export async function registerIpcHandlers(): Promise<void> {
  // Start video stream server
  await startStreamServer()

  ipcMain.handle('auth:init', async () => {
    const session = loadSession()
    try {
      await initClient(session || undefined)
      // Add timeout to prevent hanging in test environments or when network is unavailable
      await Promise.race([
        startClient(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
      ])
      if (session && getClient()) {
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

  ipcMain.handle('auth:verifyCode', async (_event, code: string) => {
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

  ipcMain.handle('groups:create', async (_event, title: string, isForum = false) => {
    return createGroup(title, isForum)
  })

  ipcMain.handle('groups:delete', async (_event, groupId: number) => {
    return deleteGroup(groupId)
  })

  ipcMain.handle('groups:addToCreated', async (_event, groupId: number) => {
    return addCreatedGroupId(groupId)
  })

  ipcMain.handle('groups:getTopics', async (_event, groupId: number) => {
    return getForumTopics(groupId)
  })

  ipcMain.handle('groups:rename', async (_event, groupId: number, title: string) => {
    return renameGroup(groupId, title)
  })

ipcMain.handle('groups:renameTopic', async (_event, groupId: number, topicId: number, title: string) => {
  return renameForumTopic(groupId, topicId, title)
})

ipcMain.handle('groups:createTopic', async (_event, groupId: number, title: string) => {
  return createForumTopic(groupId, title)
})

ipcMain.handle('groups:deleteTopic', async (_event, groupId: number, topicId: number) => {
  return deleteForumTopic(groupId, topicId)
})

ipcMain.handle('files:list', async (_event, groupId: number) => {
    return listFiles(groupId)
  })

  ipcMain.handle('files:listByTopic', async (_event, { groupId, topicId, limit, offsetId, search }: { groupId: number; topicId: number; limit: number; offsetId?: number; search?: string }) => {
    return listFilesByTopic(groupId, topicId, limit, offsetId, search)
  })

  ipcMain.handle('files:upload', async (_event, groupId: number, filePath: string, topicId?: number) => {
    return uploadFile(groupId, filePath, topicId)
  })

  ipcMain.handle('files:upload:start', async (event, { uploadId, groupId, filePath, topicId }: { uploadId: string; groupId: number; filePath: string; topicId?: number }) => {
    try {
      const result = await uploadFileWithProgress(groupId, filePath, topicId, (progress) => {
        event.sender.send('files:upload:progress', { uploadId, progress })
      })
      try {
        const stats = await stat(filePath)
        recordTelemetry({ category: 'feature', name: 'file:uploaded', payload: { sizeBytes: stats.size, mimeCategory: getMimeCategory(filePath) } })
      } catch {
        recordTelemetry({ category: 'feature', name: 'file:uploaded', payload: { mimeCategory: getMimeCategory(filePath) } })
      }
      return result
    } catch (err) {
      throw err
    }
  })

  ipcMain.handle('files:uploadTemp:start', async (event, { uploadId, groupId, fileName, data, topicId }: { uploadId: string; groupId: number; fileName: string; data: number[]; topicId?: number }) => {
    const tempDir = join(app.getPath('temp'), 'telestorage_uploads')
    const destPath = join(tempDir, fileName)
    await mkdir(tempDir, { recursive: true })
    await writeFile(destPath, Buffer.from(data))
    try {
      const result = await uploadFileWithProgress(groupId, destPath, topicId, (progress) => {
        event.sender.send('files:upload:progress', { uploadId, progress })
      })
      recordTelemetry({ category: 'feature', name: 'file:uploaded', payload: { sizeBytes: data.length, mimeCategory: getMimeCategory(fileName) } })
      return result
    } finally {
      await unlink(destPath).catch(() => {})
    }
  })

  ipcMain.handle('files:uploadMultiple', async (_event, groupId: number, filePaths: string[], topicId?: number) => {
    return uploadMultipleFiles(groupId, filePaths, topicId)
  })

  ipcMain.handle('files:download', async (_event, groupId: number, messageId: number, filePath: string) => {
    return downloadFile(groupId, messageId, filePath)
  })

  ipcMain.handle('files:listMore', async (_event, { groupId, offsetId, search }: { groupId: number; offsetId?: number; search?: string }) => {
    const settings = getSettings()
    return listFilesBatch(groupId, settings.batchSize, offsetId, search)
  })

  ipcMain.handle('files:download:start', async (event, { downloadId, groupId, messageId, destPath }) => {
    const result = await downloadFileWithProgress(groupId, messageId, destPath, (progress) => {
      event.sender.send('files:download:progress', { downloadId, progress })
    })
    try {
      const stats = await stat(destPath)
      recordTelemetry({ category: 'feature', name: 'file:downloaded', payload: { sizeBytes: stats.size } })
    } catch {
      recordTelemetry({ category: 'feature', name: 'file:downloaded' })
    }
    return result
  })

  ipcMain.handle('files:delete', async (_event, groupId: number, messageId: number) => {
    return deleteFile(groupId, messageId)
  })

  ipcMain.handle('files:downloadPreview', async (event, { downloadId, groupId, messageId, ext = '' }) => {
    const tmpDir = app.getPath('temp')
    const destPath = join(tmpDir, 'telestorage', `${messageId}_preview${ext}`)
    return downloadFileWithProgress(groupId, messageId, destPath, (progress) => {
      event.sender.send('files:download:progress', { downloadId, progress })
    })
  })

  ipcMain.handle('video:startStream', async (_event, { groupId, messageId, mimeType, fileSize }: { groupId: number; messageId: number; mimeType: string; fileSize: number }) => {
    const streamId = `${groupId}_${messageId}_${Date.now()}`
    const port = getStreamServerPort()
    registerStream(streamId, { groupId, messageId, mimeType, fileSize })
    return { streamId, url: `http://127.0.0.1:${port}/stream/${streamId}` }
  })

  ipcMain.handle('video:stopStream', async (_event, streamId: string) => {
    unregisterStream(streamId)
  })

  ipcMain.handle('files:downloadThumb', async (_event, groupId: number, messageId: number) => {
    const tmpDir = app.getPath('temp')
    const destPath = join(tmpDir, 'telestorage_thumbs', `${messageId}.jpg`)
    return downloadThumbnail(groupId, messageId, destPath)
  })

  ipcMain.handle('settings:get', async () => {
    return getSettings()
  })

  ipcMain.handle('settings:set', async (_event, partial: Partial<AppSettings>) => {
    const result = setSettings(partial)
    Object.keys(partial).forEach(key => {
      recordTelemetry({ category: 'feature', name: 'settings:changed', payload: { key } })
    })
    return result
  })

  ipcMain.handle('shell:showInFolder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:pickFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Seleccionar archivos para subir'
    })
    if (result.canceled || result.filePaths.length === 0) return []
    return result.filePaths
  })

  ipcMain.handle('files:uploadTempFile', async (_event, groupId: number, fileName: string, data: number[], topicId?: number) => {
    const client = getClient()
    if (!client) throw new Error('Not authenticated')

    const tempDir = join(app.getPath('temp'), 'telestorage_uploads')
    const { mkdir, writeFile, unlink } = await import('fs/promises')
    await mkdir(tempDir, { recursive: true })

    const destPath = join(tempDir, `${Date.now()}_${fileName}`)
    await writeFile(destPath, Buffer.from(data))

    try {
      const r = await uploadFile(groupId, destPath, topicId)
      await unlink(destPath)
      return r
    } catch (err) {
      await unlink(destPath).catch(() => {})
      throw err
    }
  })

  ipcMain.handle('log:getPath', async () => {
    return log.transports.file.getFile().path
  })

  ipcMain.handle('log:open', async () => {
    const logPath = log.transports.file.getFile().path
    shell.showItemInFolder(logPath)
  })

  const VALID_CATEGORIES: TelemetryCategory[] = ['lifecycle', 'feature', 'error']

  ipcMain.handle('telemetry:record', (_event, event: Omit<TelemetryEvent, 'id' | 'timestamp'>) => {
    if (!VALID_CATEGORIES.includes(event.category)) {
      throw new Error(`Invalid telemetry category: ${event.category}`)
    }
    recordTelemetry(event)
  })

  ipcMain.handle('telemetry:get', () => {
    return getTelemetryEvents()
  })

  ipcMain.handle('telemetry:export', () => {
    return exportTelemetry()
  })

  ipcMain.handle('telemetry:clear', () => {
    clearTelemetry()
  })

  ipcMain.handle('shell:openCrashesFolder', async () => {
    const crashesPath = app.getPath('crashDumps')
    const result = await shell.openPath(crashesPath)
    if (result) throw new Error(result)
  })
}
