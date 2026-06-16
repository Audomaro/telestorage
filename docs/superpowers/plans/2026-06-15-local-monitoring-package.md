# Local-Only Monitoring Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only monitoring package that records crashes, structured errors, unhandled exceptions, and opt-in usage telemetry with a 7-day retention policy and Settings UI controls.

**Architecture:** A single `electron/main/monitoring/` module handles crash reporting, error handlers, and telemetry persistence. Settings storage gains a `telemetryEnabled` flag. Telemetry events flow through IPC so the renderer can record feature usage. The Settings page exposes a toggle, export, clear, and crash-folder actions.

**Tech Stack:** Electron, TypeScript, `electron-log`, `vitest`, MUI, React.

---

## File Structure

- **Create:**
  - `electron/main/monitoring/types.ts` — shared telemetry types.
  - `electron/main/monitoring/telemetry-store.ts` — JSON persistence, batching, retention, export, clear.
  - `electron/main/monitoring/index.ts` — `initMonitoring()`, crash reporter, error handlers, IPC wiring.
  - `tests/unit/electron/main/monitoring/telemetry-store.test.ts` — telemetry store unit tests.
  - `tests/unit/electron/main/monitoring/index.test.ts` — error handler / structured logging tests.

- **Modify:**
  - `electron/main/telegram/settings.ts` — add `telemetryEnabled: boolean` (default `false`).
  - `electron/main/index.ts` — call `initMonitoring()` early.
  - `electron/main/ipc.ts` — register `telemetry:record`, `telemetry:get`, `telemetry:export`, `telemetry:clear`.
  - `electron/preload/index.ts` — expose telemetry methods on `window.telegramAPI`.
  - `src/pages/SettingsPage.tsx` — add telemetry section with toggle, export, clear, open crashes folder.
  - `src/types/electron.d.ts` — add `telemetryEnabled` to `AppSettings` and telemetry methods to `TelegramAPI`.
  - `tests/unit/electron/telegram/settings.test.ts` — update defaults test.

---

### Task 1: Add `telemetryEnabled` setting

**Files:**
- Modify: `electron/main/telegram/settings.ts`
- Test: `tests/unit/electron/telegram/settings.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/unit/electron/telegram/settings.test.ts`, add a test that asserts `getSettings()` returns `telemetryEnabled: false` by default.

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { app } from 'electron'
import { getSettings, setSettings } from '../../../../electron/main/telegram/settings'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/tmp/telestorage-test/${name}`)
  }
}))

describe('settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns telemetryEnabled false by default', () => {
    const settings = getSettings()
    expect(settings.telemetryEnabled).toBe(false)
  })

  it('persists telemetryEnabled', () => {
    setSettings({ telemetryEnabled: true })
    expect(getSettings().telemetryEnabled).toBe(true)
    setSettings({ telemetryEnabled: false })
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:
```bash
npx vitest run tests/unit/electron/telegram/settings.test.ts
```

Expected: FAIL — `telemetryEnabled` property missing or not `false`.

- [ ] **Step 3: Update settings defaults and type**

Edit `electron/main/telegram/settings.ts`:

```ts
export interface AppSettings {
  downloadPath: string
  createdGroupIds: number[]
  batchSize: number
  defaultTab: 'created' | 'active' | 'archived'
  excludedFromMedia: string[]
  themeMode: 'light' | 'dark'
  telemetryEnabled: boolean
}

const DEFAULTS: AppSettings = {
  downloadPath: app.getPath('downloads'),
  createdGroupIds: [],
  batchSize: 50,
  defaultTab: 'created',
  excludedFromMedia: [],
  themeMode: 'light',
  telemetryEnabled: false
}
```

Also update `src/types/electron.d.ts`:

```ts
interface AppSettings {
  downloadPath: string
  createdGroupIds: number[]
  batchSize: number
  defaultTab: 'created' | 'active' | 'archived'
  excludedFromMedia: string[]
  themeMode: 'light' | 'dark'
  telemetryEnabled: boolean
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run:
```bash
npx vitest run tests/unit/electron/telegram/settings.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add electron/main/telegram/settings.ts src/types/electron.d.ts tests/unit/electron/telegram/settings.test.ts
git commit -m "feat(settings): add telemetryEnabled flag, default false"
```

---

### Task 2: Create telemetry types

**Files:**
- Create: `electron/main/monitoring/types.ts`
- Test: none (types only)

- [ ] **Step 1: Create the types file**

Create `electron/main/monitoring/types.ts`:

```ts
export type TelemetryCategory = 'lifecycle' | 'feature' | 'error'

export interface TelemetryEvent {
  id: string
  timestamp: string
  category: TelemetryCategory
  name: string
  payload?: Record<string, unknown>
}

export interface TelemetryStoreConfig {
  retentionDays: number
  filePath: string
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/main/monitoring/types.ts
git commit -m "feat(monitoring): add telemetry types"
```

---

### Task 3: Implement telemetry store with retention

**Files:**
- Create: `electron/main/monitoring/telemetry-store.ts`
- Test: `tests/unit/electron/main/monitoring/telemetry-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/electron/main/monitoring/telemetry-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { createTelemetryStore } from '../../../../electron/main/monitoring/telemetry-store'
import type { TelemetryEvent } from '../../../../electron/main/monitoring/types'

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
```

- [ ] **Step 2: Run tests and confirm they fail**

Run:
```bash
npx vitest run tests/unit/electron/main/monitoring/telemetry-store.test.ts
```

Expected: FAIL — `createTelemetryStore` not found, file not written.

- [ ] **Step 3: Implement telemetry store**

Create `electron/main/monitoring/telemetry-store.ts`:

```ts
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
```

- [ ] **Step 4: Run tests and confirm they pass**

Run:
```bash
npx vitest run tests/unit/electron/main/monitoring/telemetry-store.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add electron/main/monitoring/telemetry-store.ts tests/unit/electron/main/monitoring/telemetry-store.test.ts
git commit -m "feat(monitoring): implement telemetry store with 7-day retention"
```

---

### Task 4: Implement monitoring init with crash reporter and error handlers

**Files:**
- Create: `electron/main/monitoring/index.ts`
- Test: `tests/unit/electron/main/monitoring/index.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/electron/main/monitoring/index.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/userData'),
    on: vi.fn(),
    quit: vi.fn()
  },
  crashReporter: { start: vi.fn(), getCrashesDirectory: vi.fn(() => '/tmp/crashes') },
  dialog: { showErrorBox: vi.fn() }
}))

describe('monitoring logError', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports a logError function that logs structured errors', async () => {
    const logMock = vi.fn()
    vi.doMock('electron-log/main', () => ({
      default: {
        error: logMock,
        initialize: vi.fn(),
        transports: { file: { level: 'info' }, console: { level: 'debug' } }
      }
    }))

    const { logError } = await import('../../../../electron/main/monitoring/index')
    const error = new Error('boom')
    logError(error, { source: 'test' })

    expect(logMock).toHaveBeenCalledOnce()
    const logged = logMock.mock.calls[0][0]
    expect(logged.message).toBe('boom')
    expect(logged.context.source).toBe('test')
    expect(logged.stack).toContain('Error: boom')
    expect(logged.timestamp).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests and confirm they fail**

Run:
```bash
npx vitest run tests/unit/electron/main/monitoring/index.test.ts
```

Expected: FAIL — `logError` not exported.

- [ ] **Step 3: Implement monitoring module**

Create `electron/main/monitoring/index.ts`:

```ts
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
    submitUrl: '',
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
```

- [ ] **Step 4: Run tests and confirm they pass**

Run:
```bash
npx vitest run tests/unit/electron/main/monitoring/index.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add electron/main/monitoring/index.ts tests/unit/electron/main/monitoring/index.test.ts
git commit -m "feat(monitoring): add crash reporter, error handlers, telemetry init"
```

---

### Task 5: Wire monitoring into the main process

**Files:**
- Modify: `electron/main/index.ts`

- [ ] **Step 1: Import and call initMonitoring**

Edit `electron/main/index.ts`:

```ts
import { config } from 'dotenv'
import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import log from 'electron-log/main'

const prodEnvPath = join(process.resourcesPath, '.env')
const devEnvPath = join(process.cwd(), '.env')
config({ path: existsSync(prodEnvPath) ? prodEnvPath : devEnvPath })

import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc'
import { initMonitoring, recordTelemetry, flushTelemetry } from './monitoring'

log.initialize({ preload: true })
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

initMonitoring()

// ... rest of file unchanged ...
```

- [ ] **Step 2: Record lifecycle events**

In the same file, update the `app.whenReady()` block:

```ts
app.whenReady().then(async () => {
  recordTelemetry({ category: 'lifecycle', name: 'app:ready' })
  Menu.setApplicationMenu(null)
  await registerIpcHandlers()
  createWindow()

  if (app.isPackaged) {
    recordTelemetry({ category: 'lifecycle', name: 'update:check-started' })
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      recordTelemetry({ category: 'lifecycle', name: 'update:check-failed' })
      log.warn('Auto-updater check failed:', err)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})
```

Add `app:started` and `app:quit` events near the top and bottom of the file:

```ts
recordTelemetry({ category: 'lifecycle', name: 'app:started' })
```

Place this right after `initMonitoring()`.

For quit:

```ts
app.on('window-all-closed', () => {
  recordTelemetry({ category: 'lifecycle', name: 'app:quit' })
  flushTelemetry()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npm run typecheck:node
```

Expected: PASS (pre-existing TS errors aside).

- [ ] **Step 4: Commit**

```bash
git add electron/main/index.ts
git commit -m "feat(monitoring): wire initMonitoring and lifecycle events into main"
```

---

### Task 6: Add telemetry IPC handlers

**Files:**
- Modify: `electron/main/ipc.ts`

- [ ] **Step 1: Import telemetry functions**

At the top of `electron/main/ipc.ts`, add:

```ts
import { recordTelemetry, getTelemetryEvents, exportTelemetry, clearTelemetry } from './monitoring'
import type { TelemetryEvent } from './monitoring/types'
```

- [ ] **Step 2: Register handlers at the end of registerIpcHandlers**

Add before the final closing brace:

```ts
  ipcMain.handle('telemetry:record', async (_event, event: { category: string; name: string; payload?: Record<string, unknown> }) => {
    recordTelemetry(event as Omit<TelemetryEvent, 'id' | 'timestamp'>)
  })

  ipcMain.handle('telemetry:get', async () => {
    return getTelemetryEvents()
  })

  ipcMain.handle('telemetry:export', async () => {
    return exportTelemetry()
  })

  ipcMain.handle('telemetry:clear', async () => {
    clearTelemetry()
  })
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npm run typecheck:node
```

Expected: PASS (pre-existing TS errors aside).

- [ ] **Step 4: Commit**

```bash
git add electron/main/ipc.ts
git commit -m "feat(monitoring): add telemetry IPC handlers"
```

---

### Task 7: Expose telemetry APIs in preload

**Files:**
- Modify: `electron/preload/index.ts`

- [ ] **Step 1: Add telemetry methods**

Add to the `contextBridge.exposeInMainWorld('telegramAPI', { ... })` object:

```ts
  recordTelemetry: (event: { category: string; name: string; payload?: Record<string, unknown> }) =>
    ipcRenderer.invoke('telemetry:record', event),
  getTelemetry: () => ipcRenderer.invoke('telemetry:get'),
  exportTelemetry: () => ipcRenderer.invoke('telemetry:export'),
  clearTelemetry: () => ipcRenderer.invoke('telemetry:clear'),
  openCrashesFolder: () => ipcRenderer.invoke('shell:openCrashesFolder'),
```

- [ ] **Step 2: Add `shell:openCrashesFolder` handler in ipc.ts**

In `electron/main/ipc.ts`, add:

```ts
import { crashReporter } from 'electron'
```

Then register:

```ts
  ipcMain.handle('shell:openCrashesFolder', async () => {
    const crashesPath = crashReporter.getCrashesDirectory()
    shell.openPath(crashesPath)
  })
```

- [ ] **Step 3: Update renderer type declarations**

In `src/types/electron.d.ts`, add to the `TelegramAPI` interface after `openLogFolder`:

```ts
  recordTelemetry(event: { category: string; name: string; payload?: Record<string, unknown> }): Promise<void>
  getTelemetry(): Promise<any[]>
  exportTelemetry(): Promise<string>
  clearTelemetry(): Promise<void>
  openCrashesFolder(): Promise<void>
```

- [ ] **Step 4: Typecheck**

Run:
```bash
npm run typecheck:node && npm run typecheck:web
```

Expected: PASS (pre-existing TS errors aside).

- [ ] **Step 5: Commit**

```bash
git add electron/preload/index.ts electron/main/ipc.ts src/types/electron.d.ts
git commit -m "feat(monitoring): expose telemetry APIs and crashes folder in preload"
```

---

### Task 8: Add telemetry section to Settings page

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add imports**

Add to the imports:

```tsx
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import DeleteIcon from '@mui/icons-material/Delete'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
```

- [ ] **Step 2: Add state and load telemetryEnabled**

Add state:

```tsx
  const [telemetryEnabled, setTelemetryEnabled] = useState(false)
```

Update the `useEffect` loader:

```tsx
  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
      setBatchSize(s.batchSize ?? 50)
      setDefaultTab(s.defaultTab ?? 'created')
      if (s.excludedFromMedia) setExcludedTags(s.excludedFromMedia)
      setThemeMode(s.themeMode ?? 'light')
      setTelemetryEnabled(s.telemetryEnabled ?? false)
      setLoaded(true)
    })
  }, [])
```

- [ ] **Step 3: Update save handler**

```tsx
      await window.telegramAPI.setSettings({
        downloadPath,
        batchSize,
        defaultTab,
        excludedFromMedia: [...new Set(excludedTags.map(t => t.toLowerCase().trim()))].filter(Boolean),
        themeMode,
        telemetryEnabled,
      })
```

- [ ] **Step 4: Add telemetry helpers**

Inside the component:

```tsx
  const handleExportTelemetry = async () => {
    const json = await window.telegramAPI.exportTelemetry()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telestorage-telemetry-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showSnackbar('Telemetry exported', 'success')
  }

  const handleClearTelemetry = async () => {
    if (!window.confirm('Delete all locally stored telemetry data? This cannot be undone.')) return
    await window.telegramAPI.clearTelemetry()
    showSnackbar('Telemetry cleared', 'success')
  }

  const handleOpenCrashesFolder = () => {
    window.telegramAPI.openCrashesFolder()
  }
```

- [ ] **Step 5: Add telemetry section to SECTIONS**

```tsx
const SECTIONS = [
  { key: 'theme', icon: <PaletteIcon />, title: 'Apariencia' },
  { key: 'nav', icon: <NavigationIcon />, title: 'Navegación' },
  { key: 'download', icon: <DownloadIcon />, title: 'Descargas' },
  { key: 'telemetry', icon: <AnalyticsIcon />, title: 'Telemetría' },
  { key: 'advanced', icon: <SettingsSuggestIcon />, title: 'Avanzado' },
] as const
```

- [ ] **Step 6: Render the telemetry section**

Add a new branch in the `SECTIONS.map` render:

```tsx
                {section.key === 'telemetry' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={telemetryEnabled}
                          onChange={e => setTelemetryEnabled(e.target.checked)}
                        />
                      }
                      label="Help improve TeleStorage by sharing usage data"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Usage data is stored locally and is never uploaded automatically.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportTelemetry}
                        disabled={!telemetryEnabled}
                      >
                        Export telemetry
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleClearTelemetry}
                      >
                        Clear telemetry
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FolderOpenIcon />}
                        onClick={handleOpenCrashesFolder}
                      >
                        Open crashes folder
                      </Button>
                    </Box>
                  </Box>
                )}
```

- [ ] **Step 7: Typecheck web**

Run:
```bash
npm run typecheck:web
```

Expected: PASS (pre-existing TS errors aside).

- [ ] **Step 8: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat(settings): add telemetry opt-in toggle, export, clear, and crashes folder"
```

---

### Task 9: Record feature usage telemetry

**Files:**
- Modify: `src/pages/SettingsPage.tsx` (already touched)
- Modify: `electron/main/ipc.ts`

- [ ] **Step 1: Record settings opened and tab changed in SettingsPage**

Add to `useEffect` (with empty deps) after mount:

```tsx
  useEffect(() => {
    window.telegramAPI.recordTelemetry({ category: 'feature', name: 'settings:opened' })
  }, [])
```

- [ ] **Step 2: Record upload and download events in ipc.ts**

In `electron/main/ipc.ts`, find the upload and download handlers and add telemetry calls:

For uploads (around `files:upload`):

```ts
  ipcMain.handle('files:upload', async (_event, groupId: number, filePath: string, topicId?: number) => {
    try {
      const stats = await import('fs/promises').then(fs => fs.stat(filePath))
      recordTelemetry({ category: 'feature', name: 'file:uploaded', payload: { sizeBytes: stats.size } })
    } catch {
      recordTelemetry({ category: 'feature', name: 'file:uploaded' })
    }
    return uploadFile(groupId, filePath, topicId)
  })
```

For downloads (around `files:download`):

```ts
  ipcMain.handle('files:download', async (_event, groupId: number, messageId: number, filePath: string) => {
    const result = await downloadFile(groupId, messageId, filePath)
    recordTelemetry({ category: 'feature', name: 'file:downloaded' })
    return result
  })
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/SettingsPage.tsx electron/main/ipc.ts
git commit -m "feat(monitoring): record upload, download, and settings-opened telemetry"
```

---

### Task 10: Verify tests, build, and lint

**Files:** none

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: All tests pass (130 existing + new tests).

- [ ] **Step 2: Run type checks**

```bash
npm run typecheck:node
npm run typecheck:web
```

Expected: Only pre-existing TypeScript errors remain.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Smoke test in dev**

```bash
npm run dev
```

Manually:
1. Open Settings.
2. Enable telemetry.
3. Verify `userData/telemetry/events.json` is created after performing an action.
4. Disable telemetry and confirm no new events.
5. Export telemetry JSON from Settings.
6. Clear telemetry and confirm file is deleted.

- [ ] **Step 5: Commit any final fixes**

```bash
git add .
git commit -m "fix(monitoring): final adjustments from test/build verification"
```

---

## Self-Review Checklist

- [ ] Spec coverage: crash reporting, error handlers, telemetry store, opt-in toggle, export/clear, retention, lifecycle events, feature events all map to tasks.
- [ ] No placeholders: every step has file paths, code, and commands.
- [ ] Type consistency: `TelemetryEvent`, `telemetryEnabled`, `recordTelemetry`, `getTelemetryEvents`, `exportTelemetry`, `clearTelemetry` names match across files.
- [ ] No external service calls or uploads.
- [ ] Telemetry defaults to off.
- [ ] 7-day retention implemented in store.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-15-local-monitoring-package.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach do you want?
