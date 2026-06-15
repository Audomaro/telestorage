import { describe, it, expect, beforeEach } from 'vitest'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { createTelemetryStore } from '../../../../../electron/main/monitoring/telemetry-store'
import type { TelemetryEvent } from '../../../../../electron/main/monitoring/types'

const tmpDir = join(process.cwd(), 'tmp-monitoring-test')
const filePath = join(tmpDir, 'events.json')

function makeEvent(timestamp: string, name = 'test:event'): TelemetryEvent {
  return { id: `id-${timestamp}`, timestamp, category: 'feature', name }
}

describe('telemetry-store', () => {
  beforeEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    mkdirSync(tmpDir, { recursive: true })
  })

  it('does not create file until flush', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    store.record(makeEvent(new Date().toISOString()))
    expect(existsSync(filePath)).toBe(false)
  })

  it('writes events on flush', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const event = makeEvent(new Date().toISOString())
    store.record(event)
    await store.flush()
    expect(existsSync(filePath)).toBe(true)
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(event.id)
  })

  it('purges events older than retentionDays', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const oldEvent = makeEvent('2020-01-01T00:00:00.000Z')
    const recentEvent = makeEvent(new Date().toISOString())
    store.record(oldEvent)
    store.record(recentEvent)
    await store.flush()
    const events = store.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe(recentEvent.id)
  })

  it('exports events as JSON string', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const event = makeEvent(new Date().toISOString())
    store.record(event)
    await store.flush()
    const exported = store.export()
    expect(JSON.parse(exported)).toHaveLength(1)
  })

  it('clears events and deletes file', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    store.record(makeEvent(new Date().toISOString()))
    await store.flush()
    store.clear()
    expect(existsSync(filePath)).toBe(false)
    expect(store.getEvents()).toHaveLength(0)
  })
})
