import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/userData'),
    on: vi.fn(),
    quit: vi.fn()
  },
  crashReporter: { start: vi.fn(), getCrashesDirectory: vi.fn(() => '/tmp/crashes') },
  dialog: { showErrorBox: vi.fn() }
}))

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

    const uncaughtHandler = processOnSpy.mock.calls.find(([event]) => event === 'uncaughtException')?.[1] as Function
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

    const rejectionHandler = processOnSpy.mock.calls.find(([event]) => event === 'unhandledRejection')?.[1] as Function
    expect(rejectionHandler).toBeDefined()
    rejectionHandler('some reason')

    expect(logMock).toHaveBeenCalled()
    const logged = logMock.mock.calls[0][0]
    expect(logged.message).toBe('some reason')
  })
})
