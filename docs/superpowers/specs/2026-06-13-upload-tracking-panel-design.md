# Upload Tracking Panel Design

## Overview
Add upload progress tracking to the existing download panel, creating a single combined "Transferencias" panel. Uploads initiated from UploadDialog will run in the background with real-time progress visible in the panel.

## Architecture

```
renderer                              main process
────────────────────────────────────────────────────────────
UploadDialog → uploadFileWithProgress() → IPC → uploadFile() with progressCallback
                    ↓                                  ↓
              UploadContext                    files:upload:progress events
                    ↓                                  ↓
              TransferPanel                    event.sender.send(...)
```

## Components

### UploadContext (`src/theme/UploadContext.tsx`)
Mirrors `DownloadContext` exactly:
- `UploadStatus`: `'uploading' | 'completed' | 'error'`
- `UploadTask`: `{ id, fileName, progress, status, error?, completedAt? }`
- `UploadContextValue`: `{ uploads, addUpload, updateProgress, completeUpload, failUpload, removeUpload }`
- `UploadProvider` wraps app alongside `DownloadProvider`

### IPC Layer (`electron/main/ipc.ts`)
- `files:upload:start` — receives `{ uploadId, groupId, filePath, topicId }`, calls GramJS `sendFile` with `progressCallback` that sends `files:upload:progress({ uploadId, progress })` events
- `files:uploadTemp:start` — receives `{ uploadId, groupId, fileName, data, topicId }`, writes temp file to disk, then calls `sendFile` with progress callback

GramJS `sendFile` supports `progressCallback` natively (tested via node_modules/telegram/client/uploads.js).

### Preload Bridge (`electron/preload/index.ts`)
- `uploadFileWithProgress(groupId, filePath, topicId, onProgress)` — generates `uploadId`, registers `files:upload:progress` listener, invokes `files:upload:start`
- `uploadTempFileWithProgress(groupId, fileName, data, topicId, onProgress)` — same pattern, invokes `files:uploadTemp:start`

Both follow the exact same pattern as `downloadFileWithProgress`.

### TransferPanel (`src/components/TransferPanel.tsx`)
Replaces `DownloadPanel`. Same glassmorphism styling (320px width, backdrop blur, border, shadow), same position (sticky sidebar). Adds MUI `<Tabs>` at the top:
- **"Descargas"** tab — shows `downloads` from `DownloadContext` (identical to current DownloadPanel behavior)
- **"Subidas"** tab — shows `uploads` from `UploadContext`
- `TransferItem` component (renamed from `DownloadItem`) adapted for both upload/download types
- Clear completed button per section
- Empty state per tab

### TransferItem (`src/components/TransferItem.tsx`)
Renamed from `DownloadItem`, extended to handle both `UploadTask` and `DownloadTask`:
- Shows file name, progress bar, status icon
- Upload type: no "show in folder" button (file hasn't been saved locally)
- Completed download: "show in folder" button
- Error state: shows error message, remove button
- Completed upload: remove button only

### GroupFilesPage changes
- New `uploadWithTracking` helper (mirrors `downloadWithTracking`)
  - Calls `addUpload(uploadId, fileName)`
  - Calls `uploadFileWithProgress(...)` with progress callback → `updateProgress`
  - On complete: `completeUpload(uploadId)`
  - On error: `failUpload(uploadId, errorMsg)`
- UploadDialog returns the file list; GroupFilesPage handles uploads

### UploadDialog changes
- Dialog still opens, user selects files, clicks "Subir"  
- Instead of blocking `for` loop, returns files via `onUploadComplete(files)` and closes immediately (no file paths retained in dialog)
- UploadDialog no longer manages `uploading` state or LinearProgress
- GroupFilesPage handles the actual uploads via `uploadWithTracking`

### App.tsx changes
- Add `<UploadProvider>` wrapping children
- Replace `<DownloadPanel />` with `<TransferPanel />`
- Toggle button unchanged

### Types (`src/types/electron.d.ts`)
- Add `uploadFileWithProgress` and `uploadTempFileWithProgress` to `TelegramAPI` interface

## Data Flow

1. User opens UploadDialog, selects files, clicks "Subir"
2. UploadDialog calls `onUploadStart(files)` with file list
3. UploadDialog closes
4. GroupFilesPage iterates files **sequentially** (one at a time, same as current behavior), for each:
   a. Generates `uploadId`
   b. Calls `addUpload(uploadId, fileName)` 
   c. Calls `uploadFileWithProgress(...)` with progress callback
   d. Progress events update UploadContext → TransferPanel re-renders
5. After each upload completes → `completeUpload(uploadId)`
6. After **all** uploads in the batch finish `loadInitialFiles()` refreshes the file list
6. Error → `failUpload(uploadId, error)`

## Error Handling
- Upload errors shown in TransferPanel per-item (status: 'error', error message)
- Same snackbar pattern for batch errors

## Testing
- Unit tests for UploadContext (same pattern as DownloadContext)
- Update GroupFilesPage tests for new upload flow
- Update E2E tests if needed
