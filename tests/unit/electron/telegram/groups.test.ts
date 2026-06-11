import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  safeStorage: { isEncryptionAvailable: () => true, encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() },
  app: { getPath: () => '/tmp' },
  ipcMain: { handle: vi.fn() }
}))

describe('Group functions', () => {
  it('should export getGroups', async () => {
    const mod = await import('../../../../electron/main/telegram/groups')
    expect(mod.getGroups).toBeDefined()
  })

  it('should export getArchivedGroups', async () => {
    const mod = await import('../../../../electron/main/telegram/groups')
    expect(mod.getArchivedGroups).toBeDefined()
  })

  it('should export createGroup', async () => {
    const mod = await import('../../../../electron/main/telegram/groups')
    expect(mod.createGroup).toBeDefined()
  })

  describe('isGroupAppCreated', () => {
    it('should have isGroupAppCreated exported', async () => {
      const mod = await import('../../../../electron/main/telegram/groups')
      expect(mod.isGroupAppCreated).toBeDefined()
    })

    it('should return true for matching id', async () => {
      const { isGroupAppCreated } = await import('../../../../electron/main/telegram/groups')
      expect(isGroupAppCreated(123, [123, 456])).toBe(true)
    })

    it('should return false for non-matching id', async () => {
      const { isGroupAppCreated } = await import('../../../../electron/main/telegram/groups')
      expect(isGroupAppCreated(789, [123, 456])).toBe(false)
    })
  })

})
