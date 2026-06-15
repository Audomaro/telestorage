import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import log from 'electron-log/main'
import type { TelemetryEvent, TelemetryStoreConfig } from './types'

export interface TelemetryStore {
  record(event: TelemetryEvent): void
  flush(): void
  getEvents(): TelemetryEvent[]
  export(): string
  clear(): void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function isOlderThan(dateString: string, retentionDays: number): boolean {
  const eventDate = new Date(dateString).getTime()
  const cutoff = Date.now() - retentionDays * MS_PER_DAY
  return eventDate < cutoff
}

export function createTelemetryStore(config: TelemetryStoreConfig): TelemetryStore {
  const { filePath, retentionDays } = config
  const batch: TelemetryEvent[] = []

  function persist(): boolean {
    let allEvents: TelemetryEvent[] = []
    if (existsSync(filePath)) {
      try {
        allEvents = JSON.parse(readFileSync(filePath, 'utf-8')) as TelemetryEvent[]
      } catch (err) {
        log.error('Failed to read existing telemetry file, starting fresh:', err)
        allEvents = []
      }
    }

    const merged = [...allEvents, ...batch]
    const kept = merged.filter(e => !isOlderThan(e.timestamp, retentionDays))

    if (kept.length === 0) {
      if (existsSync(filePath)) {
        try { unlinkSync(filePath) } catch (err) { log.error('Failed to delete empty telemetry file:', err) }
      }
      return true
    }

    try {
      mkdirSync(dirname(filePath), { recursive: true })
      writeFileSync(filePath, JSON.stringify(kept, null, 2))
      return true
    } catch (err) {
      log.error('Failed to persist telemetry events:', err)
      return false
    }
  }

  const store: TelemetryStore = {
    record(event) {
      batch.push({
        ...event,
        id: event.id || generateId()
      })
    },

    flush() {
      if (persist()) batch.length = 0
    },

    getEvents() {
      if (!existsSync(filePath)) return []
      try {
        const events = JSON.parse(readFileSync(filePath, 'utf-8')) as TelemetryEvent[]
        const kept = events.filter(e => !isOlderThan(e.timestamp, retentionDays))
        if (kept.length === 0 && existsSync(filePath)) {
          try { unlinkSync(filePath) } catch (err) { log.error('Failed to delete stale telemetry file:', err) }
        }
        return kept
      } catch (err) {
        log.error('Failed to read telemetry events:', err)
        return []
      }
    },

    export() {
      const recentBatch = batch.filter(e => !isOlderThan(e.timestamp, retentionDays))
      return JSON.stringify([...store.getEvents(), ...recentBatch], null, 2)
    },

    clear() {
      batch.length = 0
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath)
        } catch (err) {
          log.error('Failed to clear telemetry file:', err)
        }
      }
    }
  }

  return store
}
