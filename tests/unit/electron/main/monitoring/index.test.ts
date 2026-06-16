import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AppSettings } from '../../../../../electron/main/telegram/settings'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/userData'),
    on: vi.fn(),
    quit: vi.fn()
  },
  crashReporter: { start: vi.fn(), getCrashesDirectory: vi.fn(() => '/tmp/crashes') },
  dialog: { showErrorBox: vi.fn() }
}))

const { mockStore, mockCreateTelemetryStore } = vi.hoisted(() => {
  const mockStore = {
    record: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    getEvents: vi.fn().mockReturnValue([{ id: '1', timestamp: 't', category: 'feature', name: 'test' }]),
    export: vi.fn().mockReturnValue('[]'),
    clear: vi.fn()
  }
  return {
    mockStore,
    mockCreateTelemetryStore: vi.fn(() => mockStore)
  }
})

vi.mock('../../../../../electron/main/monitoring/telemetry-store', () => ({
  createTelemetryStore: mockCreateTelemetryStore,
  generateId: vi.fn(() => 'generated-id')
}))

vi.mock('../../../../../electron/main/telegram/settings', () => ({
  getSettings: vi.fn(() => ({ telemetryEnabled: false })),
  setSettings: vi.fn()
}))

afterEach(() => {
  process.removeAllListeners('uncaughtException')
  process.removeAllListeners('unhandledRejection')
})

describe('monitoring logError', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports a logError function that logs structured errors', async () => {
    const logMock = vi.fn()
    vi.doMock('electron-log/main', () => ({
      default: {
        error: logMock,
        initialize: vi.fn(),
        transports: { file: { level: 'info' }, console: { level: 'debug' } }
      }
    }))

    const { logError } = await import('../../../../../electron/main/monitoring/index')
    const error = new Error('boom')
    logError(error, { source: 'test' })

    expect(logMock).toHaveBeenCalledOnce()
    const logged = logMock.mock.calls[0][0]
    expect(logged.message).toBe('boom')
    expect(logged.context.source).toBe('test')
    expect(logged.stack).toContain('Error: boom')
    expect(logged.timestamp).toBeDefined()
  })

  it('logError records error:logged telemetry when enabled', async () => {
    const logMock = vi.fn()
    vi.doMock('electron-log/main', () => ({
      default: {
        error: logMock,
        initialize: vi.fn(),
        transports: { file: { level: 'info' }, console: { level: 'debug' } }
      }
    }))
    const settings = await import('../../../../../electron/main/telegram/settings')
    vi.mocked(settings.getSettings).mockReturnValue({ telemetryEnabled: true } as AppSettings)

    const { logError, initMonitoring } = await import('../../../../../electron/main/monitoring/index')
    initMonitoring()
    const error = new Error('boom')
    logError(error, { source: 'test' })

    expect(mockStore.record).toHaveBeenCalledWith(expect.objectContaining({
      category: 'error',
      name: 'error:logged',
      payload: { source: 'test', message: 'boom' }
    }))
  })
})

describe('initMonitoring', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts crash reporter in local-only mode', async () => {
    const { crashReporter } = await import('electron')
    vi.resetModules()
    const { initMonitoring } = await import('../../../../../electron/main/monitoring/index')
    initMonitoring()
    expect(crashReporter.start).toHaveBeenCalledWith({
      submitURL: '',
      uploadToServer: false,
      ignoreSystemCrashHandler: true
    })
  })

  it('is idempotent', async () => {
    const { crashReporter } = await import('electron')
    vi.clearAllMocks()
    const { initMonitoring } = await import('../../../../../electron/main/monitoring/index')
    initMonitoring()
    initMonitoring()
    expect(crashReporter.start).toHaveBeenCalledTimes(1)
  })

  it('flushes telemetry on before-quit', async () => {
    const { app } = await import('electron')
    vi.clearAllMocks()
    const { initMonitoring } = await import('../../../../../electron/main/monitoring/index')
    initMonitoring()
    const beforeQuitHandler = vi.mocked(app.on).mock.calls.find(([event]) => String(event) === 'before-quit')?.[1] as () => Promise<void>
    expect(beforeQuitHandler).toBeDefined()
    await beforeQuitHandler()
    expect(mockStore.flush).toHaveBeenCalled()
  })

  it('registers uncaughtException handler that logs and quits', async () => {
    const processOnSpy = vi.spyOn(process, 'on')
    const { app, dialog } = await import('electron')
    vi.resetModules()
    const logMock = vi.fn()
    vi.doMock('electron-log/main', () => ({
      default: { error: logMock, initialize: vi.fn(), transports: { file: { level: 'info' }, console: { level: 'debug' } } }
    }))
    const { initMonitoring } = await import('../../../../../electron/main/monitoring/index')
    initMonitoring()

    const uncaughtHandler = processOnSpy.mock.calls.find(([event]) => event === 'uncaughtException')?.[1] as (error: Error) => void
    expect(uncaughtHandler).toBeDefined()
    uncaughtHandler(new Error('crash'))

    expect(logMock).toHaveBeenCalled()
    expect(dialog.showErrorBox).toHaveBeenCalled()
    expect(app.quit).toHaveBeenCalled()
  })

  it('registers unhandledRejection handler that logs', async () => {
    const processOnSpy = vi.spyOn(process, 'on')
    vi.resetModules()
    const logMock = vi.fn()
    vi.doMock('electron-log/main', () => ({
      default: { error: logMock, initialize: vi.fn(), transports: { file: { level: 'info' }, console: { level: 'debug' } } }
    }))
    const { initMonitoring } = await import('../../../../../electron/main/monitoring/index')
    initMonitoring()

    const rejectionHandler = processOnSpy.mock.calls.find(([event]) => event === 'unhandledRejection')?.[1] as (reason: unknown) => void
    expect(rejectionHandler).toBeDefined()
    rejectionHandler('some reason')

    expect(logMock).toHaveBeenCalled()
    const logged = logMock.mock.calls[0][0]
    expect(logged.message).toBe('some reason')
  })
})

describe('telemetry wrappers', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const settings = await import('../../../../../electron/main/telegram/settings')
    vi.mocked(settings.getSettings).mockReturnValue({ telemetryEnabled: true } as AppSettings)
    const { initMonitoring } = await import('../../../../../electron/main/monitoring/index')
    initMonitoring()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('recordTelemetry delegates to store when enabled', async () => {
    const { recordTelemetry } = await import('../../../../../electron/main/monitoring/index')
    recordTelemetry({ category: 'feature', name: 'test:event' })
    expect(mockStore.record).toHaveBeenCalledWith(expect.objectContaining({
      id: 'generated-id',
      category: 'feature',
      name: 'test:event'
    }))
  })

  it('recordTelemetry does nothing when disabled', async () => {
    const settings = await import('../../../../../electron/main/telegram/settings')
    vi.mocked(settings.getSettings).mockReturnValue({ telemetryEnabled: false } as AppSettings)
    const { recordTelemetry } = await import('../../../../../electron/main/monitoring/index')
    recordTelemetry({ category: 'feature', name: 'test:event' })
    expect(mockStore.record).not.toHaveBeenCalled()
  })

  it('recordTelemetry does nothing if getSettings throws', async () => {
    const settings = await import('../../../../../electron/main/telegram/settings')
    vi.mocked(settings.getSettings).mockImplementation(() => { throw new Error('settings failed') })
    const { recordTelemetry } = await import('../../../../../electron/main/monitoring/index')
    recordTelemetry({ category: 'feature', name: 'test:event' })
    expect(mockStore.record).not.toHaveBeenCalled()
  })

  it('flushTelemetry delegates to store', async () => {
    const { flushTelemetry } = await import('../../../../../electron/main/monitoring/index')
    await flushTelemetry()
    expect(mockStore.flush).toHaveBeenCalled()
  })

  it('getTelemetryEvents delegates to store', async () => {
    const { getTelemetryEvents } = await import('../../../../../electron/main/monitoring/index')
    const events = getTelemetryEvents()
    expect(mockStore.getEvents).toHaveBeenCalled()
    expect(events).toHaveLength(1)
  })

  it('exportTelemetry delegates to store', async () => {
    const { exportTelemetry } = await import('../../../../../electron/main/monitoring/index')
    const json = exportTelemetry()
    expect(mockStore.export).toHaveBeenCalled()
    expect(json).toBe('[]')
  })

  it('clearTelemetry delegates to store', async () => {
    const { clearTelemetry } = await import('../../../../../electron/main/monitoring/index')
    clearTelemetry()
    expect(mockStore.clear).toHaveBeenCalled()
  })
})
