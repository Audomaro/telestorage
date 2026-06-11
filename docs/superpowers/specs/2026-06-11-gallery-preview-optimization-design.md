# Gallery Preview Optimization

## Problem

FileGrid auto-downloads the **full original file** for every media card on mount, causing Telegram flood waits (`upload.GetFile`) and excessive bandwidth/temp storage usage. The Telegram API already provides inline thumbnails (`PhotoSize`, `PhotoStrippedSize`, `PhotoCachedSize`) embedded in message data as base64 data URLs via `extractThumbnail()`.

## Solution

**Grid shows inline thumbnails only. Original files are downloaded on-demand when the user opens the preview modal.**

## Changes

### FileGrid.tsx
- Remove `downloadStates`, `downloadStatesRef`, `autoStartedRef` refs/state
- Remove `CircularProgress` import
- Remove `useEffect` auto-download on mount
- Remove `onDownload` prop entirely
- `handleClick(file)` → calls `onPreview(file)` directly, no async download
- Render: show `f.thumbnail` (base64 data URL) as `<img>`, or gradient if null
- Show `▶️` badge for videos
- No file name overlay

### PreviewModal.tsx
- **Remove** prop: `localPath` (modal manages its own download)
- **Add** props: `groupId: number`, `onLoadOriginal: (file, onProgress) => Promise<string>`
- State: `loading`, `progress`, `localPath`, `error`
- `useEffect` on `file`: starts download, sets loading, calls `onLoadOriginal`, updates localPath
- Shows: loading spinner + progress % while downloading, media when done, error message on failure
- On file change (prev/next from parent): effect re-runs automatically
- Error handling: catch, set error state, show message in UI

### GroupFilesPage.tsx
- Remove `previewLocalPath` state
- `handlePreviewOpen` → `setPreviewFile(file)` only
- `navigateTo` → `setPreviewFile(target)` only
- Pass `groupId` and `onLoadOriginal={handleGridPreview}` to PreviewModal

### Tests
- **FileGrid.test.tsx**: simplify — remove download/progress tests, keep render/thumbnail tests
- **PreviewModal.test.tsx**: update props if exists

## Edge Cases
- **No thumbnail**: show gradient background
- **Download fails in modal**: show error message, user can close and retry
- **Video in modal**: download original, show `<video controls autoPlay>`
- **Non-media in grid**: filtered out; only media files render in grid
- **Flood wait during modal download**: GramJS handles retries internally; error shown if exhausted
- **Rapid prev/next**: each navigation cancels previous download (the effect cleanup + re-run pattern handles this naturally)

## Non-Goals
- No IntersectionObserver / virtual scrolling (thumbnails are already in memory)
- No temp file cleanup (existing behavior, unchanged)
- No thumbnail quality options (Telegram provides best available)
