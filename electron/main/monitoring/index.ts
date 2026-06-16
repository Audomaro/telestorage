import { app, crashReporter, dialog } from 'electron'
import { join } from 'path'
import log from 'electron-log/main'
import { createTelemetryStore, TelemetryStore, generateId } from './telemetry-store'
import type { TelemetryEvent } from './types'
import { getSettings } from '../telegram/settings'

let telemetryStore: TelemetryStore | null = null
let initialized = false

export function logError(error: Error, context?: Record<string, unknown>): void {
  log.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
  recordTelemetry({ category: 'error', name: 'error:logged', payload: { source: context?.source, message: error.message } })
}

function isTelemetryEnabled(): boolean {
  try {
    return getSettings().telemetryEnabled
  } catch {
    return false
  }
}

export function recordTelemetry(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): void {
  if (!isTelemetryEnabled() || !telemetryStore) return
  telemetryStore.record({
    ...event,
    id: generateId(),
    timestamp: new Date().toISOString()
  })
}

export async function flushTelemetry(): Promise<void> {
  await telemetryStore?.flush()
}

export function getTelemetryEvents(): TelemetryEvent[] {
  return telemetryStore?.getEvents() ?? []
}

export function exportTelemetry(): string {
  return telemetryStore?.export() ?? JSON.stringify([], null, 2)
}

export function clearTelemetry(): void {
  telemetryStore?.clear()
}

function initCrashReporter(): void {
  try {
    crashReporter.start({
      submitURL: '',
      uploadToServer: false,
      ignoreSystemCrashHandler: true
    })
  } catch (err) {
    log.error({
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      context: { source: 'initCrashReporter' },
      timestamp: new Date().toISOString()
    })
  }
}

function initErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    logError(error, { source: 'uncaughtException' })
    try {
      dialog.showErrorBox(
        'Unexpected error',
        'TeleStorage encountered an error and will close.'
      )
    } finally {
      app.quit()
    }
  })

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    logError(error, { source: 'unhandledRejection' })
  })
}

export function initMonitoring(): void {
  if (initialized) return

  const telemetryFile = join(app.getPath('userData'), 'telemetry', 'events.json')
  telemetryStore = createTelemetryStore({ retentionDays: 7, filePath: telemetryFile })

  initCrashReporter()
  initErrorHandlers()

  app.on('before-quit', () => {
    flushTelemetry()
  })

  initialized = true
}
