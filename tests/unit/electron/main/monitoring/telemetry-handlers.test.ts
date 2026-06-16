import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ipcMain } from 'electron'
import { join } from 'path'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  app: { getPath: vi.fn(() => '/tmp/userData'), on: vi.fn(), quit: vi.fn() },
  crashReporter: { start: vi.fn(), getCrashesDirectory: vi.fn(() => '/tmp/crashes') },
  dialog: { showErrorBox: vi.fn() }
}))

vi.mock('../../../../../electron/main/telegram/settings', () => ({
  getSettings: vi.fn(() => ({ telemetryEnabled: true })),
  setSettings: vi.fn()
}))

const recordTelemetryMock = vi.hoisted(() => vi.fn())
const getTelemetryEventsMock = vi.hoisted(() => vi.fn())
const exportTelemetryMock = vi.hoisted(() => vi.fn())
const clearTelemetryMock = vi.hoisted(() => vi.fn())

vi.mock('../../../../../electron/main/monitoring', () => ({
  recordTelemetry: recordTelemetryMock,
  getTelemetryEvents: getTelemetryEventsMock,
  exportTelemetry: exportTelemetryMock,
  clearTelemetry: clearTelemetryMock,
  initMonitoring: vi.fn()
}))

const uploadFileWithProgressMock = vi.fn()
const downloadFileWithProgressMock = vi.fn()
vi.mock('../../../../../electron/main/telegram/files', () => ({
  uploadFileWithProgress: uploadFileWithProgressMock,
  downloadFileWithProgress: downloadFileWithProgressMock,
  uploadFile: vi.fn(),
  downloadFile: vi.fn()
}))

vi.mock('../../../../../electron/main/streamServer', () => ({
  startStreamServer: vi.fn(() => Promise.resolve(0)),
  registerStream: vi.fn(),
  unregisterStream: vi.fn(),
  getStreamServerPort: vi.fn(() => 0)
}))

describe('telemetry IPC handlers', { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records file:uploaded after successful upload:start', async () => {
    uploadFileWithProgressMock.mockResolvedValue({ messageId: 1 })
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()

    const uploadHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'files:upload:start')?.[1] as Function
    const event = { sender: { send: vi.fn() } }
    await uploadHandler(event, { uploadId: 'u1', groupId: 1, filePath: join(process.cwd(), 'tests/unit/electron/main/telegram/fixtures/sample.txt') })

    expect(recordTelemetryMock).toHaveBeenCalledWith(expect.objectContaining({
      category: 'feature',
      name: 'file:uploaded',
      payload: expect.objectContaining({ mimeCategory: 'document' })
    }))
  })

  it('does not record file:uploaded when upload:start fails', async () => {
    uploadFileWithProgressMock.mockRejectedValue(new Error('upload failed'))
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()

    const uploadHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'files:upload:start')?.[1] as Function
    const event = { sender: { send: vi.fn() } }
    await expect(uploadHandler(event, { uploadId: 'u1', groupId: 1, filePath: 'nonexistent.txt' })).rejects.toThrow('upload failed')

    expect(recordTelemetryMock).not.toHaveBeenCalled()
  })

  it('records file:downloaded with sizeBytes after successful download:start', async () => {
    const destPath = join(process.cwd(), 'tmp-monitoring-test', 'downloaded.txt')
    const { mkdirSync, writeFileSync } = await import('fs')
    mkdirSync(join(process.cwd(), 'tmp-monitoring-test'), { recursive: true })
    writeFileSync(destPath, 'hello')
    downloadFileWithProgressMock.mockResolvedValue({ path: destPath })
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()

    const downloadHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'files:download:start')?.[1] as Function
    const event = { sender: { send: vi.fn() } }
    await downloadHandler(event, { downloadId: 'd1', groupId: 1, messageId: 1, destPath })

    expect(recordTelemetryMock).toHaveBeenCalledWith({
      category: 'feature',
      name: 'file:downloaded',
      payload: { sizeBytes: 5 }
    })
  })

  it('records file:uploaded with sizeBytes and mimeCategory after successful uploadTemp:start', async () => {
    uploadFileWithProgressMock.mockResolvedValue({ messageId: 2 })
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()

    const uploadTempHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'files:uploadTemp:start')?.[1] as Function
    const event = { sender: { send: vi.fn() } }
    const data = [1, 2, 3, 4, 5]
    await uploadTempHandler(event, { uploadId: 'u2', groupId: 1, fileName: 'sample.txt', data, topicId: undefined })

    expect(recordTelemetryMock).toHaveBeenCalledWith({
      category: 'feature',
      name: 'file:uploaded',
      payload: { sizeBytes: data.length, mimeCategory: 'document' }
    })
  })

  it('files:upload does not record telemetry', async () => {
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()
    const uploadHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'files:upload')?.[1] as Function
    await uploadHandler({}, 1, join(process.cwd(), 'tests/unit/electron/main/telegram/fixtures/sample.txt'))
    expect(recordTelemetryMock).not.toHaveBeenCalled()
  })

  it('files:download does not record telemetry', async () => {
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()
    const downloadHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'files:download')?.[1] as Function
    await downloadHandler({}, 1, 1, join(process.cwd(), 'tests/unit/electron/main/telegram/fixtures/sample.txt'))
    expect(recordTelemetryMock).not.toHaveBeenCalled()
  })

  it('records settings:changed for each key in settings:set', async () => {
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()

    const settingsHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'settings:set')?.[1] as Function
    await settingsHandler({}, { telemetryEnabled: true, batchSize: 100 })

    expect(recordTelemetryMock).toHaveBeenCalledWith({
      category: 'feature',
      name: 'settings:changed',
      payload: { key: 'telemetryEnabled' }
    })
    expect(recordTelemetryMock).toHaveBeenCalledWith({
      category: 'feature',
      name: 'settings:changed',
      payload: { key: 'batchSize' }
    })
  })

  it('telemetry:record delegates to recordTelemetry', async () => {
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()
    const recordHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'telemetry:record')?.[1] as Function
    await recordHandler({}, { category: 'feature', name: 'test:event' })
    expect(recordTelemetryMock).toHaveBeenCalledWith({ category: 'feature', name: 'test:event' })
  })

  it('telemetry:get returns events', async () => {
    getTelemetryEventsMock.mockReturnValue([{ id: '1', timestamp: 't', category: 'feature', name: 'test' }])
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()
    const getHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'telemetry:get')?.[1] as Function
    const result = await getHandler()
    expect(result).toHaveLength(1)
  })

  it('telemetry:export returns JSON', async () => {
    exportTelemetryMock.mockReturnValue('[]')
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()
    const exportHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'telemetry:export')?.[1] as Function
    const result = await exportHandler()
    expect(result).toBe('[]')
  })

  it('telemetry:clear delegates to clearTelemetry', async () => {
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()
    const clearHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'telemetry:clear')?.[1] as Function
    await clearHandler()
    expect(clearTelemetryMock).toHaveBeenCalled()
  })
})
