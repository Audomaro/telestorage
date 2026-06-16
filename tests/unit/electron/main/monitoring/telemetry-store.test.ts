import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('flush with empty batch purges old persisted events', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const oldEvent = makeEvent('2020-01-01T00:00:00.000Z')
    store.record(oldEvent)
    await store.flush()
    expect(store.getEvents()).toHaveLength(0)
  })

  it('purgeOldEvents removes old events and rewrites the file', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const oldEvent = makeEvent('2020-01-01T00:00:00.000Z')
    const recentEvent = makeEvent(new Date().toISOString())
    store.record(oldEvent)
    store.record(recentEvent)
    await store.flush()
    store.purgeOldEvents()
    const events = store.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe(recentEvent.id)
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(recentEvent.id)
  })

  it('resets the debounce timer on each record', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    store.record(makeEvent(new Date().toISOString()))
    await vi.advanceTimersByTimeAsync(1500)
    expect(existsSync(filePath)).toBe(false)
    store.record(makeEvent(new Date().toISOString()))
    await vi.advanceTimersByTimeAsync(500)
    expect(existsSync(filePath)).toBe(false)
    await vi.advanceTimersByTimeAsync(1500)
    expect(existsSync(filePath)).toBe(true)
  })

  it('record without id generates one', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    const event: TelemetryEvent = {
      id: '',
      timestamp: new Date().toISOString(),
      category: 'feature',
      name: 'test:event'
    }
    store.record(event)
    await store.flush()
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

  it('export excludes out-of-retention batched events', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    store.record(makeEvent(new Date().toISOString()))
    store.record(makeEvent('2020-01-01T00:00:00.000Z'))
    const exported = JSON.parse(store.export())
    expect(exported).toHaveLength(1)
  })

  it('getEvents returns empty array when file does not exist', () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    expect(store.getEvents()).toHaveLength(0)
  })

  it('returns empty events when file is corrupted', () => {
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(filePath, 'not json')
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    expect(store.getEvents()).toHaveLength(0)
  })

  it('recovers from non-array JSON in events file', async () => {
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(filePath, '{"foo":"bar"}')
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    expect(store.getEvents()).toHaveLength(0)
    const event = makeEvent(new Date().toISOString())
    store.record(event)
    await store.flush()
    expect(store.getEvents()).toHaveLength(1)
  })

  it('flushes debounced after record', async () => {
    const store = createTelemetryStore({ retentionDays: 7, filePath })
    store.record(makeEvent(new Date().toISOString()))
    expect(existsSync(filePath)).toBe(false)
    await vi.advanceTimersByTimeAsync(2000)
    expect(existsSync(filePath)).toBe(true)
  })
})
