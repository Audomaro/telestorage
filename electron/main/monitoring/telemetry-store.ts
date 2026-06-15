import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs'
import { dirname } from 'path'
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

function isOlderThan(dateString: string, retentionDays: number): boolean {
  const eventDate = new Date(dateString).getTime()
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  return eventDate < cutoff
}

export function createTelemetryStore(config: TelemetryStoreConfig): TelemetryStore {
  const { filePath, retentionDays } = config
  const batch: TelemetryEvent[] = []

  function persist(): void {
    const allEvents = existsSync(filePath)
      ? (JSON.parse(readFileSync(filePath, 'utf-8')) as TelemetryEvent[])
      : []
    const merged = [...allEvents, ...batch]
    const kept = merged.filter(e => !isOlderThan(e.timestamp, retentionDays))
    if (kept.length === 0) {
      if (existsSync(filePath)) unlinkSync(filePath)
      return
    }
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, JSON.stringify(kept, null, 2))
  }

  return {
    record(event) {
      batch.push({
        ...event,
        id: event.id || generateId()
      })
    },

    flush() {
      if (batch.length === 0) return
      persist()
      batch.length = 0
    },

    getEvents() {
      if (!existsSync(filePath)) return []
      return JSON.parse(readFileSync(filePath, 'utf-8')) as TelemetryEvent[]
    },

    export() {
      return JSON.stringify(this.getEvents(), null, 2)
    },

    clear() {
      batch.length = 0
      if (existsSync(filePath)) unlinkSync(filePath)
    }
  }
}
