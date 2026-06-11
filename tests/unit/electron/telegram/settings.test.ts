import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' },
  safeStorage: { isEncryptionAvailable: () => true, encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() },
  ipcMain: { handle: vi.fn() }
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, readFileSync: vi.fn(), writeFileSync: vi.fn(), existsSync: vi.fn() }
})

import { readFileSync, writeFileSync, existsSync } from 'fs'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createdGroupIds', () => {
  it('should default to empty array', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getSettings } = await import('../../../../electron/main/telegram/settings')
    const settings = getSettings()
    expect(settings.createdGroupIds).toEqual([])
  })

  it('should add a group id and persist', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { addCreatedGroupId, getSettings } = await import('../../../../electron/main/telegram/settings')
    addCreatedGroupId(123)
    const settings = getSettings()
    expect(settings.createdGroupIds).toContain(123)
    expect(settings.createdGroupIds.length).toBe(1)
  })

  it('should not duplicate group ids', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { addCreatedGroupId, getSettings } = await import('../../../../electron/main/telegram/settings')
    addCreatedGroupId(123)
    addCreatedGroupId(123)
    const settings = getSettings()
    expect(settings.createdGroupIds.filter(id => id === 123).length).toBe(1)
  })
})
