import { describe, it, expect, vi } from 'vitest'
import { listFilesBatch } from '../../../../electron/main/telegram/files'

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

describe('downloadFileWithProgress', () => {
  it('should accept progress callback', async () => {
    const mod = await import('../../../../electron/main/telegram/files')
    expect(mod.downloadFileWithProgress).toBeDefined()
  })
})

describe('thumbnail extraction', () => {
  it('should extract thumbnail data URL from PhotoStrippedSize', async () => {
    const { extractThumbnail } = await import('../../../../electron/main/telegram/files')

    const mockMedia = {
      photo: {
        sizes: [
          { className: 'PhotoStrippedSize', type: 'i', bytes: Buffer.from([10, 0xd8, 0xff, 0xe0]) }
        ]
      }
    }
    const result = extractThumbnail(mockMedia as any)
    expect(result).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('should return null for media without thumbnail', async () => {
    const { extractThumbnail } = await import('../../../../electron/main/telegram/files')
    const result = extractThumbnail({ document: { mimeType: 'application/pdf' } } as any)
    expect(result).toBeNull()
  })

  it('should return null for missing photo sizes', async () => {
    const { extractThumbnail } = await import('../../../../electron/main/telegram/files')
    const result = extractThumbnail({ photo: { sizes: [] } } as any)
    expect(result).toBeNull()
  })
})

describe('listFilesBatch', () => {
  it('should be a function', () => {
    expect(typeof listFilesBatch).toBe('function')
  })
})
