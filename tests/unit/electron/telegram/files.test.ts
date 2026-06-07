import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  safeStorage: { isEncryptionAvailable: () => true, encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() },
  app: { getPath: () => '/tmp' },
  ipcMain: { handle: vi.fn() }
}))

describe('File functions exports', () => {
  it('should export listFiles', async () => {
    const mod = await import('../../../../electron/main/telegram/files')
    expect(mod.listFiles).toBeDefined()
  })

  it('should export uploadFile', async () => {
    const mod = await import('../../../../electron/main/telegram/files')
    expect(mod.uploadFile).toBeDefined()
  })

  it('should export downloadFile', async () => {
    const mod = await import('../../../../electron/main/telegram/files')
    expect(mod.downloadFile).toBeDefined()
  })

  it('should export deleteFile', async () => {
    const mod = await import('../../../../electron/main/telegram/files')
    expect(mod.deleteFile).toBeDefined()
  })

  it('should export forwardFile', async () => {
    const mod = await import('../../../../electron/main/telegram/files')
    expect(mod.forwardFile).toBeDefined()
  })
})
