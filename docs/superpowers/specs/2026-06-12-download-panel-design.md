# Download Progress Panel

**Date:** 2026-06-12
**Status:** Draft

## Overview

Replace the current invisible download flow with a visible **Download Progress Panel** — a floating card on the right side that tracks all active and completed downloads. Users can see progress, cancel items, open completed files, and retry failures.

## Requirements

- Show all active + completed downloads in a fixed panel on the right side
- Each download: file name, progress bar, percentage, file size
- Per-item actions: cancel, retry (on failure), open folder (on completion)
- Panel header: "Descargas" + Clear button (remove all completed)
- Auto-remove: completed items auto-remove after 10 seconds (dismissible before)
- Failed items stay until manually removed or retried
- Panel visible across all pages (GroupList, GroupFiles, Settings)
- Panel only appears when there are downloads
- Slide-in animation when first download starts

## Data Flow

### Download lifecycle

1. User clicks "Download" or "Guardar en disco" → handler generates `downloadId`, adds task to DownloadContext
2. Handler calls `downloadFileWithProgress` (already available via IPC)
3. Main process emits `files:download:progress` events with `{downloadId, progress}`
4. DownloadContext updates the task's progress
5. Download completes → `completeDownload` sets status=completed, stores `destPath`
6. Download fails → `failDownload` sets status=error, stores error message
7. Completed item: shows checkmark, "Open folder" button, auto-removes after 10s
8. Failed item: shows red icon, error message, "Retry" button (creates new task)
9. User can click "×" to remove any item

### DownloadContext

- `addDownload(id, fileName)` — create pending task
- `updateProgress(id, progress)` — update progress (0-1)
- `completeDownload(id, destPath)` — mark completed
- `failDownload(id, error)` — mark failed
- `removeDownload(id)` — remove from list
- `retryDownload(id)` — internal: removes failed item, re-runs handler

### State shape

```ts
interface DownloadTask {
  id: string
  fileName: string
  progress: number        // 0-1
  status: 'pending' | 'downloading' | 'completed' | 'error'
  error?: string
  destPath?: string
  completedAt?: number    // timestamp for auto-remove
}
```

## Architecture

### New files

| File | Purpose |
|------|---------|
| `src/theme/DownloadContext.tsx` | Global download state (Context + Provider + hook) |
| `src/components/DownloadPanel.tsx` | Fixed-position card with download list + header |
| `src/components/DownloadItem.tsx` | Single download row (progress bar + actions) |

### Modified files

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap in `DownloadProvider`, render `<DownloadPanel />` outside scrollable area |
| `src/pages/GroupFilesPage.tsx` | Replace `downloadFile` with `downloadFileWithProgress` in `handleDownload` + `handleSaveToDisk` |
| `src/components/PreviewModal.tsx` | Replace `downloadFile` with `downloadFileWithProgress` in `handleSaveToDisk` (if exists) |

### DownloadContext

```tsx
type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'error'

interface DownloadTask {
  id: string
  fileName: string
  progress: number
  status: DownloadStatus
  error?: string
  destPath?: string
  completedAt?: number
}

interface DownloadContextValue {
  downloads: DownloadTask[]
  addDownload: (id: string, fileName: string) => void
  updateProgress: (id: string, progress: number) => void
  completeDownload: (id: string, destPath: string) => void
  failDownload: (id: string, error: string) => void
  removeDownload: (id: string) => void
  retryDownload: (id: string) => void
}
```

Provider: wraps `App.tsx` at root level (same pattern as `ColorModeProvider`, `SnackbarProvider`).

### DownloadPanel

- `position: fixed`, `right: 16px`, `top: 72px`, `width: 320px`, `maxHeight: 80vh`
- MUI `Paper` with elevation, border-radius, z-index above content
- Scrollable if list exceeds viewport
- Header: "Descargas" text + "Clear" button (removes all completed)
- Only renders when `downloads.length > 0`
- Slide-in animation via MUI `Slide` or `Grow` transition

### DownloadItem

Layout:
```
┌─────────────────────────────┐
│ [📄] photo.jpg          [×] │
│ ████████████░░░░░░  68%     │
│ 2.4 MB / 3.5 MB             │
└─────────────────────────────┘
```

Components:
- File icon (`InsertDriveFileIcon` or `ImageIcon` based on MIME)
- File name (truncated with `noWrap`)
- Progress bar: `LinearProgress` with `variant="determinate"`, value=progress*100
- Percentage text: `${Math.round(progress * 100)}%`
- Cancel/Remove: `IconButton` with `CloseIcon`

**Completed state:**
- Green checkmark (`CheckCircleIcon`, color: success)
- "Open folder" button (`IconButton` with `FolderOpenIcon`)
- Auto-removes after 10 seconds (setTimeout on mount, cleared on unmount)

**Error state:**
- Red error icon (`ErrorIcon`, color: error)
- Error message (truncated)
- "Retry" button (`IconButton` with `RefreshIcon`)

**Progress bar colors:**
- Pending: `color="info"` (indeterminate)
- Downloading: `color="primary"` (determinate)
- Completed: `color="success"` (full)
- Error: `color="error"` (full)

### Integration in GroupFilesPage

Replace `handleDownload`:
```tsx
const handleDownload = async (file: TelegramFile) => {
  const settings = await window.telegramAPI.getSettings()
  const destPath = `${settings.downloadPath}\\${file.messageId}_${file.name}`
  const downloadId = `${file.messageId}_${Date.now()}`
  addDownload(downloadId, file.name)
  try {
    await window.telegramAPI.downloadFileWithProgress(
      group.id, file.messageId, destPath,
      (progress) => updateProgress(downloadId, progress)
    )
    completeDownload(downloadId, destPath)
  } catch (err: any) {
    failDownload(downloadId, err.message || 'Error al descargar')
  }
}
```

Same pattern for `handleSaveToDisk`.

### Auto-remove

- `useEffect` in DownloadItem: when `status === 'completed'`, start a 10-second timer
- Timer clears on unmount (user manually removes item)
- After 10s, calls `removeDownload(id)`

### Open folder

- Uses `shell.openExternal` or `shell.showItemInFolder` from Electron
- Requires a new IPC: `shell:openFolder(path)` or `shell:showInFolder(path)`

## Cancel vs Remove

- **Cancel button** (×) removes the item from the panel immediately
- The actual download continues in the background — true cancellation requires AbortController wiring through IPC, which is out of scope for this iteration
- The user can re-open the panel and re-trigger the download if needed

## Error handling

- If download fails mid-way, `downloadFileWithProgress` rejects
- The error is caught in the handler, `failDownload` is called
- Failed item stays in panel until user clicks Retry or Remove
- Retry creates a new `downloadId` and re-runs the download

## Testing

- `DownloadContext.test.tsx`: test add, progress, complete, fail, remove
- `DownloadItem.test.tsx`: test rendering in all states (pending, downloading, completed, error)
- `DownloadPanel.test.tsx`: test renders list, clear button, empty state
- `GroupFilesPage`: test `handleDownload` uses `downloadFileWithProgress` and calls `addDownload`

## Performance

- Context re-renders all consumers on every progress update (every ~100ms per download)
- Mitigated by: DownloadPanel only renders when there are downloads, and the panel itself is a small component
- If performance becomes an issue, split state into `downloads` array (stable) + individual `DownloadItem` components that receive their own task via `useMemo` (already the planned approach)

## Files changed

| File | Change |
|------|--------|
| `src/theme/DownloadContext.tsx` | New file — Context, Provider, hook |
| `src/components/DownloadPanel.tsx` | New file — fixed panel with header + list |
| `src/components/DownloadItem.tsx` | New file — single download row |
| `src/App.tsx` | Add `DownloadProvider` wrapper, render `<DownloadPanel />` |
| `src/pages/GroupFilesPage.tsx` | Replace `downloadFile` with `downloadFileWithProgress` in handlers |
| `electron/main/ipc.ts` | Add `shell:showInFolder` IPC handler |
| `electron/preload/index.ts` | Expose `showInFolder` method |
| `src/types/electron.d.ts` | Add `showInFolder` to `TelegramAPI` interface |
| `tests/unit/theme/DownloadContext.test.tsx` | New test |
| `tests/unit/components/DownloadItem.test.tsx` | New test |
| `tests/unit/components/DownloadPanel.test.tsx` | New test |
