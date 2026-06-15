import { describe, it, expect, beforeEach } from 'vitest'
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
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

  it('writes events on flush', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const event = makeEvent(new Date().toISOString())
    store.record(event)
    store.flush()
    expect(existsSync(filePath)).toBe(true)
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(event.id)
  })

  it('purges events older than retentionDays', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const oldEvent = makeEvent('2020-01-01T00:00:00.000Z')
    const recentEvent = makeEvent(new Date().toISOString())
    store.record(oldEvent)
    store.record(recentEvent)
    store.flush()
    const events = store.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe(recentEvent.id)
  })

  it('exports events as JSON string', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const event = makeEvent(new Date().toISOString())
    store.record(event)
    store.flush()
    const exported = store.export()
    expect(JSON.parse(exported)).toHaveLength(1)
  })

  it('clears events and deletes file', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    store.record(makeEvent(new Date().toISOString()))
    store.flush()
    store.clear()
    expect(existsSync(filePath)).toBe(false)
    expect(store.getEvents()).toHaveLength(0)
  })

  it('flush with empty batch does not create file or purge old data', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    store.flush()
    expect(existsSync(filePath)).toBe(false)

    mkdirSync(tmpDir, { recursive: true })
    const oldEvent = makeEvent('2020-01-01T00:00:00.000Z')
    writeFileSync(filePath, JSON.stringify([oldEvent]))
    store.flush()
    expect(existsSync(filePath)).toBe(true)
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(oldEvent.id)
  })

  it('record without id generates one', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const event: TelemetryEvent = {
      id: '',
      timestamp: new Date().toISOString(),
      category: 'feature',
      name: 'test:event'
    }
    store.record(event)
    store.flush()
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    expect(parsed[0].id).toBeTruthy()
    expect(parsed[0].id).not.toBe('')
  })

  it('export without flush includes the in-memory batch', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const event = makeEvent(new Date().toISOString())
    store.record(event)
    expect(existsSync(filePath)).toBe(false)
    const exported = JSON.parse(store.export())
    expect(exported).toHaveLength(1)
    expect(exported[0].id).toBe(event.id)
  })

  it('getEvents returns empty array when file does not exist', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    expect(store.getEvents()).toHaveLength(0)
  })
})
