import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface AppSettings {
  downloadPath: string
  createdGroupIds: number[]
  batchSize: number
  defaultTab: 'created' | 'active' | 'archived'
}

const SETTINGS_FILE = join(app.getPath('userData'), 'settings.json')

const DEFAULTS: AppSettings = {
  downloadPath: app.getPath('downloads'),
  createdGroupIds: [],
  batchSize: 50,
  defaultTab: 'created'
}

export function getSettings(): AppSettings {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'))
      return { ...DEFAULTS, ...data }
    }
  } catch {}
  return { ...DEFAULTS }
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...partial }
  writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2))
  return updated
}

export function addCreatedGroupId(id: number): AppSettings {
  const current = getSettings()
  if (current.createdGroupIds.includes(id)) return current
  const updated = { ...current, createdGroupIds: [...current.createdGroupIds, id] }
  writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2))
  return updated
}
