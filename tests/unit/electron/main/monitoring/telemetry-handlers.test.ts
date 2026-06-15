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

const recordTelemetryMock = vi.fn()
vi.mock('../../../../../electron/main/monitoring', () => ({
  recordTelemetry: recordTelemetryMock,
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

describe('telemetry IPC handlers', () => {
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

    expect(recordTelemetryMock).toHaveBeenCalledWith(expect.objectContaining({ category: 'feature', name: 'file:uploaded' }))
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

  it('records file:downloaded after successful download:start', async () => {
    downloadFileWithProgressMock.mockResolvedValue({ path: '/tmp/file.txt' })
    const { registerIpcHandlers } = await import('../../../../../electron/main/ipc')
    await registerIpcHandlers()

    const downloadHandler = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'files:download:start')?.[1] as Function
    const event = { sender: { send: vi.fn() } }
    await downloadHandler(event, { downloadId: 'd1', groupId: 1, messageId: 1, destPath: '/tmp/file.txt' })

    expect(recordTelemetryMock).toHaveBeenCalledWith({ category: 'feature', name: 'file:downloaded' })
  })

  it('records file:uploaded with sizeBytes after successful uploadTemp:start', async () => {
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
      payload: { sizeBytes: data.length }
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
})
