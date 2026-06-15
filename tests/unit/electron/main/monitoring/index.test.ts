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
