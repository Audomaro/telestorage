import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (s: string) => Buffer.from(s),
    decryptString: (b: Buffer) => b.toString()
  },
  app: {
    getPath: () => '/tmp'
  },
  ipcMain: {
    handle: vi.fn()
  }
}))

describe('Storage functions module exports', () => {
  it('should export saveSession', async () => {
    const mod = await import('../../../../electron/main/telegram/storage')
    expect(mod.saveSession).toBeDefined()
  })

  it('should export loadSession', async () => {
    const mod = await import('../../../../electron/main/telegram/storage')
    expect(mod.loadSession).toBeDefined()
  })

  it('should export clearSession', async () => {
    const mod = await import('../../../../electron/main/telegram/storage')
    expect(mod.clearSession).toBeDefined()
  })
})
