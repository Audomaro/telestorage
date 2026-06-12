import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { unlinkSync, existsSync as realExistsSync } from 'fs'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' },
  safeStorage: { isEncryptionAvailable: () => true, encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() },
  ipcMain: { handle: vi.fn() }
}))

const SETTINGS_PATH = '/tmp/settings.json'

beforeEach(() => {
  if (realExistsSync(SETTINGS_PATH)) {
    unlinkSync(SETTINGS_PATH)
  }
})

afterEach(() => {
  if (realExistsSync(SETTINGS_PATH)) {
    unlinkSync(SETTINGS_PATH)
  }
})

describe('createdGroupIds', () => {
  it('should default to empty array', async () => {
    const { getSettings } = await import('../../../../electron/main/telegram/settings')
    const settings = getSettings()
    expect(settings.createdGroupIds).toEqual([])
  })

  it('should add a group id and persist', async () => {
    const { addCreatedGroupId, getSettings } = await import('../../../../electron/main/telegram/settings')
    addCreatedGroupId(123)
    const settings = getSettings()
    expect(settings.createdGroupIds).toContain(123)
    expect(settings.createdGroupIds.length).toBe(1)
  })

  it('should not duplicate group ids', async () => {
    const { addCreatedGroupId, getSettings } = await import('../../../../electron/main/telegram/settings')
    addCreatedGroupId(123)
    addCreatedGroupId(123)
    const settings = getSettings()
    expect(settings.createdGroupIds.filter(id => id === 123).length).toBe(1)
  })
})

describe('batchSize', () => {
  it('should default to 50', async () => {
    const { getSettings } = await import('../../../../electron/main/telegram/settings')
    const settings = getSettings()
    expect(settings.batchSize).toBe(50)
  })

  it('should persist a custom batchSize', async () => {
    const { setSettings, getSettings } = await import('../../../../electron/main/telegram/settings')
    setSettings({ batchSize: 25 })
    const settings = getSettings()
    expect(settings.batchSize).toBe(25)
  })
})
