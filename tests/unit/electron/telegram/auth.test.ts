import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('telegram', () => ({
  TelegramClient: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    sendCode: vi.fn(),
    invoke: vi.fn(),
    signInWithPassword: vi.fn()
  })),
  Api: {
    auth: {
      SignIn: vi.fn(),
      LogOut: vi.fn()
    }
  }
}))

vi.mock('telegram/sessions', () => ({
  StringSession: vi.fn().mockImplementation(() => ({
    save: () => 'mock-session'
  }))
}))

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

describe('Auth functions module exports', () => {
  it('should export initClient', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.initClient).toBeDefined()
  })

  it('should export sendPhoneCode', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.sendPhoneCode).toBeDefined()
  })

  it('should export verifyCode', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.verifyCode).toBeDefined()
  })

  it('should export check2FA', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.check2FA).toBeDefined()
  })

  it('should export getAuthState', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.getAuthState).toBeDefined()
  })

  it('should export getSession', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.getSession).toBeDefined()
  })

  it('should export logout', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.logout).toBeDefined()
  })

  it('should export getClient', async () => {
    const mod = await import('../../../../electron/main/telegram/auth')
    expect(mod.getClient).toBeDefined()
  })
})
