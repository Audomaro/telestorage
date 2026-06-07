import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

const SESSION_FILE = 'teledrive-session.enc'

function getSessionPath(): string {
  return join(app.getPath('userData'), SESSION_FILE)
}

export function saveSession(sessionData: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available on this system')
  }
  const encrypted = safeStorage.encryptString(sessionData)
  writeFileSync(getSessionPath(), encrypted)
}

export function loadSession(): string | null {
  const path = getSessionPath()
  if (!existsSync(path)) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    const encrypted = readFileSync(path)
    return safeStorage.decryptString(encrypted)
  } catch {
    return null
  }
}

export function clearSession(): void {
  const path = getSessionPath()
  if (existsSync(path)) {
    unlinkSync(path)
  }
}
