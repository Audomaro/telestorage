# Local-Only Monitoring Package Design

## Context

TeleStorage now has a production Windows build, auto-updater, and GitHub Actions release pipeline. The next step in the deployment checklist is **C — Monitoring & stability**. The user explicitly wants:

- No third-party services
- No custom backend endpoint
- Opt-in usage analytics (default off)
- Crash reporting, structured logging, unhandled error handlers, and telemetry as one integrated package

## Goals

1. Capture native/renderer crashes locally without uploading them.
2. Add structured error logging for the main process.
3. Catch unhandled exceptions and promise rejections.
4. Provide opt-in local usage analytics with a Settings toggle.
5. Let the user view, export, and clear their telemetry data.
6. Keep the implementation small enough to live in one focused module.

## Non-Goals

- Real-time remote dashboards
- Performance profiling / timers
- Heartbeat / periodic health pings
- Automatic uploading of any data
- Code signing or privacy-policy changes beyond in-app disclosure

## Architecture

A single module under `electron/main/monitoring/` is responsible for all monitoring concerns. Existing settings storage (`electron/main/telegram/settings.ts`) is extended with one new flag.

```text
electron/main/
  monitoring/
    index.ts           # initMonitoring() wiring
    telemetry-store.ts # persistence, retention, export
    types.ts           # shared types
  telegram/settings.ts # adds telemetryEnabled
  index.ts             # calls initMonitoring() early
```

## Components

### 1. Monitoring Init (`monitoring/index.ts`)

Exports `initMonitoring()` called before `app.whenReady()` in `electron/main/index.ts`. Responsibilities:

- Start `crashReporter` in local-only mode.
- Attach `uncaughtException` and `unhandledRejection` handlers.
- Wire existing `electron-log` to structured error logging.
- Telemetry IPC handlers are registered separately in `electron/main/ipc.ts`.

### 2. Telemetry Store (`monitoring/telemetry-store.ts`)

Manages `userData/telemetry/events.json`.

Public API:

- `record(event: TelemetryEvent): void` — append to in-memory batch.
- `flush(): Promise<void>` — write batch to disk, then purge old events.
- `getEvents(): TelemetryEvent[]` — return current events.
- `export(): string` — return JSON string of all events.
- `clear(): void` — delete events file and clear batch.
- `purgeOldEvents(): void` — remove events older than 7 days.

Flush strategy:

- Debounced flush ~2 seconds after the last record.
- The debounce timer resets on each call to `record()`, so the flush happens after the most recent event.
- Forced flush on `app.before-quit`.
- No file is created unless telemetry is enabled and at least one event is recorded.

### 3. Types (`monitoring/types.ts`)

```ts
export interface TelemetryEvent {
  id: string
  timestamp: string // ISO 8601
  category: 'lifecycle' | 'feature' | 'error'
  name: string
  payload?: Record<string, unknown>
}

export interface TelemetryStoreConfig {
  retentionDays: number
  filePath: string
}
```

### 4. Settings Extension (`telegram/settings.ts`)

Add one field to `AppSettings`:

```ts
telemetryEnabled: boolean
```

Default: `false`.

### 5. Renderer Settings UI

Add a new section in the existing Settings page:

- Toggle: “Help improve TeleStorage by sharing usage data” (default off).
- Explainer text: “Usage data is stored locally and is never uploaded automatically.”
- Buttons:
  - “View telemetry data” — opens a small dialog/list.
  - “Export to file…” — opens a native save dialog and writes `telemetry-export.json` to the chosen path.
  - “Clear telemetry data” — confirms then deletes local events.
  - “Open crashes folder” — opens the crash dumps directory in Explorer.

> The actual Settings UI uses Spanish copy (`Telemetría`, `Exportar telemetría`, etc.) to match the rest of the app.

IPC additions:

- `telemetry:record` — records a telemetry event from the renderer.
- `telemetry:get` — returns events for the Settings viewer.
- `telemetry:export` — returns the telemetry data as a JSON string.
- `telemetry:exportToFile` — shows a save dialog and writes the JSON export to disk.
- `telemetry:clear` — deletes the events file.

These handlers are registered in `electron/main/ipc.ts`.

## Data Flow

1. Main process calls `telemetry.record({ category, name, payload })` directly.
2. Renderer records events via the `telemetry:record` IPC handler (e.g., `window.api.telemetry.record(...)`).
3. Telemetry store appends the event to an in-memory batch.
4. Debounced flush writes the batch to `userData/telemetry/events.json`.
5. On every flush, events older than 7 days are removed.
6. Renderer can call IPC to get/export/clear events.

## Error Handling

### Native / Renderer Crashes

Use Electron `crashReporter.start()`:

```ts
crashReporter.start({
  submitUrl: '',
  uploadToServer: false,
  ignoreSystemCrashHandler: true
})
```

Dumps are written to Electron’s crash dumps directory (`app.getPath('crashDumps')`) automatically. The Settings UI opens that folder via `shell.openPath`.

### Main-Process JS Errors

```ts
process.on('uncaughtException', (error) => {
  logError(error, { source: 'uncaughtException' })
  dialog.showErrorBox('Unexpected error', 'TeleStorage encountered an error and will close.')
  app.quit()
})
```

### Unhandled Promise Rejections

```ts
process.on('unhandledRejection', (reason) => {
  logError(reason instanceof Error ? reason : new Error(String(reason)), {
    source: 'unhandledRejection'
  })
})
```

### Structured Logging

Add a helper that logs a consistent object shape:

```ts
function logError(error: Error, context?: Record<string, unknown>) {
  log.error({ message: error.message, stack: error.stack, context, timestamp: new Date().toISOString() })
}
```

Existing `electron-log` configuration remains; file level stays at `info`.

## Privacy & Security

- Telemetry is opt-in and defaults to off.
- All monitoring data is stored locally in `userData`.
- No network transmission of telemetry or crash data.
- Telemetry payloads must not include file names, paths, message content, or credentials.
- The renderer Settings UI gives the user full visibility and control.

## Events to Record

When telemetry is enabled, record these non-sensitive events:

### Lifecycle

- `app:started`
- `app:ready` (after `app.whenReady`)
- `app:quit`
- `update:check-started`
- `update:check-failed`

### Feature

- `file:uploaded` (payload: `sizeBytes`, `mimeCategory`)
- `file:downloaded` (payload: `sizeBytes`)
- `settings:opened`
- `settings:changed` (payload: `key` only, no values)
- `tab:changed` (payload: `tab`)

### Error

- `error:logged` (payload: `source`, `message` only — no stack trace in telemetry)

## Retention

- Telemetry events older than 7 days are purged on every flush.
- Crash dump retention is managed by Electron’s crash reporter defaults.

## Testing

### Unit Tests

- `telemetry-store.ts`:
  - record + flush writes valid JSON.
  - 7-day purge removes only old events.
  - export returns all current events.
  - clear removes the file and in-memory batch.
- `logError` helper formats consistent objects.

### IPC Tests

- `telemetry:record` appends an event when telemetry is enabled.
- `telemetry:get` returns events.
- `telemetry:export` returns JSON string.
- `telemetry:clear` deletes the file.

### Manual Smoke Test

1. Enable telemetry in Settings.
2. Perform upload/download/settings actions.
3. Verify `events.json` contains expected events.
4. Disable telemetry and confirm no new events are recorded.
5. Export and clear telemetry via Settings.

## Open Questions / Future Work

- Add a renderer crash smoke test once the package stabilizes.
- Consider compressing/archiving old crash dumps.
- Consider a “Send feedback” feature that lets the user manually attach logs.

## Dependencies

No new runtime dependencies. Uses:

- `electron` (`crashReporter`, `app`, `dialog`)
- `electron-log` (already installed)
- Node.js built-ins (`fs`, `path`)

## Files to Create / Modify

### Create

- `electron/main/monitoring/index.ts`
- `electron/main/monitoring/telemetry-store.ts`
- `electron/main/monitoring/types.ts`
- Unit tests under `tests/monitoring/`

### Modify

- `electron/main/index.ts` — call `initMonitoring()` early.
- `electron/main/telegram/settings.ts` — add `telemetryEnabled`.
- `electron/main/ipc.ts` — register telemetry IPC handlers.
- `electron/preload/index.ts` — expose telemetry APIs if needed.
- Renderer Settings component — add telemetry UI.

## Success Criteria

- `crashReporter` starts in local-only mode without errors.
- Unhandled exceptions and rejections are logged and the app exits gracefully on uncaught exceptions.
- Telemetry is disabled by default and records events only when enabled.
- Telemetry file is JSON, capped to 7 days, and exportable/clearable from Settings.
- All new code passes lint and existing tests continue to pass.
