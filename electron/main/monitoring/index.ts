import { app, crashReporter, dialog } from 'electron'
import { join } from 'path'
import log from 'electron-log/main'
import { createTelemetryStore, TelemetryStore } from './telemetry-store'
import type { TelemetryEvent } from './types'
import { getSettings } from '../telegram/settings'

let telemetryStore: TelemetryStore | null = null

export function logError(error: Error, context?: Record<string, unknown>): void {
  log.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
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
    id: '',
    timestamp: new Date().toISOString()
  })
}

export function flushTelemetry(): void {
  telemetryStore?.flush()
}

export function getTelemetryEvents(): TelemetryEvent[] {
  return telemetryStore?.getEvents() ?? []
}

export function exportTelemetry(): string {
  return telemetryStore?.export() ?? '[]'
}

export function clearTelemetry(): void {
  telemetryStore?.clear()
}

function initCrashReporter(): void {
  crashReporter.start({
    submitURL: '',
    uploadToServer: false,
    ignoreSystemCrashHandler: true
  })
}

function initErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    logError(error, { source: 'uncaughtException' })
    dialog.showErrorBox(
      'Unexpected error',
      'TeleStorage encountered an error and will close.'
    )
    app.quit()
  })

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    logError(error, { source: 'unhandledRejection' })
  })
}

export function initMonitoring(): void {
  const telemetryFile = join(app.getPath('userData'), 'telemetry', 'events.json')
  telemetryStore = createTelemetryStore({ retentionDays: 7, filePath: telemetryFile })

  initCrashReporter()
  initErrorHandlers()

  app.on('before-quit', () => {
    flushTelemetry()
  })
}
