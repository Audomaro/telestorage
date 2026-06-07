# Gallery Thumbnails & Download Progress

## Overview
Show actual image thumbnails in gallery grid instead of gradient placeholders. Clicking a file starts download with a circular progress indicator overlay.

## Architecture

### Data Flow
1. `listFiles` IPC extracts thumbnail bytes from Telegram message media (photos with `PhotoStrippedSize`, documents with thumbs), returns as base64 data URLs
2. FileGrid renders `<img>` with thumbnail or gradient fallback
3. Click on grid item → `downloadFileWithProgress()` IPC with progress callback
4. Main process uses GramJS `downloadMedia({ progressCallback })` → sends progress events via `webContents.send()`
5. Preload bridges progress events to renderer callback
6. Grid item shows `CircularProgress` overlay while downloading, then displays the local image

### Components

**1. Thumbnail Extraction** (`electron/main/telegram/files.ts`)
- `listFiles` enhanced to extract thumbnail bytes:
  - Photos: find `PhotoStrippedSize` (type='i') in `media.photo.sizes`, convert `bytes` (Uint8Array) to `data:image/jpeg;base64,...`
  - Documents with thumbs: extract from `media.document.thumbs` if bytes present
  - All others: thumbnail = null
- New helper: `extractThumbnail(media): string | null`

**2. Download IPC with Progress** (`electron/main/ipc.ts`, `electron/preload/index.ts`)
- New IPC handler: `ipcMain.handle('files:download:start', async (event, { downloadId, groupId, messageId, destPath }) => { ... })`
- During download, calls `event.sender.send('files:download:progress', { downloadId, progress })` via `progressCallback`
- On completion: sends `{ downloadId, progress: 1, complete: true, filePath: destPath }`
- Preload exposes: `downloadFileWithProgress(groupId, messageId, destPath, onProgress): Promise<string>`
- Uses `downloadId` (messageId + timestamp) to correlate progress events

**3. CircularProgress Component** (`src/components/CircularProgress.tsx`)
- SVG-based circular progress indicator
- Props: `size: number`, `progress: number` (0-1), `strokeWidth?: number`
- Two concentric circles: background track (gray) + progress arc (white)
- Centered percentage text
- CSS transition on `stroke-dashoffset` for smooth animation
- Pure presentational, no state

**4. FileGrid Changes** (`src/components/FileGrid.tsx`)
- Props change: `onPreview` → `onDownload: (file: TelegramFile, onProgress: (p: number) => void) => Promise<string>`
- Each grid item renders:
  - `<img src={file.thumbnail}>` if thumbnail exists, or gradient fallback
  - Download state: idle → downloading → downloaded
  - `CircularProgress` overlay during download
  - After download: show image from local path via `<img src={localPath}>`
- Track download state per file with `Map<number, { status, progress, localPath }>`

**5. PreviewModal Changes** (`src/components/PreviewModal.tsx`)
- New prop: `localPath?: string`
- For image files: render `<img>` with the local file if available
- For video files: render `<video>` with controls
- Keep emoji fallback for non-media files

**6. GroupFilesPage Integration** (`src/pages/GroupFilesPage.tsx`)
- Replace `handleDownload` with async download that captures progress
- Pass `onDownload` to FileGrid that includes progress callback
- Pass `localPath` to PreviewModal after download completes

### Type Changes (`src/types/index.ts`)
- No new fields needed on `TelegramFile` (`thumbnail` already exists)

### Type Changes (`src/types/electron.d.ts`)
- Add `downloadFileWithProgress(groupId: number, messageId: number, destPath: string, onProgress: (p: number) => void): Promise<string>`

## Testing

### Unit Tests
- **CircularProgress**: renders SVG, shows correct progress percentage, updates on prop change
- **FileGrid**: renders images when files have thumbnails, calls onDownload on click, shows progress overlay, shows downloaded image
- **PreviewModal**: renders actual image when localPath provided, falls back to emoji
- **files.ts**: thumbnail extraction from mock PhotoStrippedSize

### IPC Tests
- Progress events flow from main → renderer
- Multiple simultaneous downloads with different downloadIds

## Files to Create/Modify

### New Files
- `src/components/CircularProgress.tsx`

### Modified Files
- `electron/main/telegram/files.ts` — thumbnail extraction, download with progress callback
- `electron/main/ipc.ts` — new `files:download:start` handler with progress events
- `electron/preload/index.ts` — expose `downloadFileWithProgress`
- `src/types/electron.d.ts` — add new method type
- `src/components/FileGrid.tsx` — image thumbnails, download with progress
- `src/components/PreviewModal.tsx` — local image display
- `src/pages/GroupFilesPage.tsx` — wire download with progress, pass localPath

## Error Handling
- Download errors: reject promise, remove progress overlay, show error toast
- Missing thumbnails: show gradient fallback
- Cancel: future enhancement (not in scope)
