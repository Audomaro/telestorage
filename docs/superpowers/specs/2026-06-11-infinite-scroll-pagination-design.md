# Infinite Scroll Pagination for File List/Gallery

## Problem

- `listFiles()` calls `getMessages(groupId, { limit: 200 })` — hard limit of 200 messages
- All 200 must download before any file is shown, causing delay on first paint
- No way to access files older than the most recent 200

## Solution

Paginate through Telegram messages in batches of 50 using `offsetId`, loading more on scroll via IntersectionObserver.

## Architecture

### Backend

**New function in `electron/main/telegram/files.ts`:**

```ts
interface ListFilesBatchResult {
  files: FileResult[]
  hasMore: boolean
}

export async function listFilesBatch(groupId: number, limit: number, offsetId?: number): Promise<ListFilesBatchResult>
```

- Calls `client.getMessages(groupId, { limit, offsetId })`
- Maps messages to `FileResult[]` (same logic as `listFiles`)
- `hasMore = messages.length === limit` (if we got exactly `limit`, there might be more older messages)

**New IPC handler `files:listMore` in `electron/main/ipc.ts`:**

```ts
ipcMain.handle('files:listMore', async (_event, { groupId, offsetId }: { groupId: number; offsetId?: number }) => {
  return listFilesBatch(groupId, 50, offsetId)
})
```

### Preload

Exposed as:

```ts
loadMoreFiles(groupId: number, offsetId?: number): Promise<{ files: FileResult[]; hasMore: boolean }>
```

### Frontend (`GroupFilesPage`)

```ts
// State
const [allFiles, setAllFiles] = useState<FileResult[]>([])
const [hasMore, setHasMore] = useState(true)
const [loadingMore, setLoadingMore] = useState(false)
const [loadedOnce, setLoadedOnce] = useState(false)

// Initial load
useEffect(() => {
  window.telegramAPI.loadMoreFiles(group.id).then(result => {
    setAllFiles(result.files)
    setHasMore(result.hasMore)
    setLoadedOnce(true)
  })
}, [group.id])

// Load next batch
async function loadMore() {
  if (loadingMore || !hasMore) return
  setLoadingMore(true)
  const lastFile = allFiles[allFiles.length - 1]
  const result = await window.telegramAPI.loadMoreFiles(group.id, lastFile?.messageId)
  setAllFiles(prev => [...prev, ...result.files])
  setHasMore(result.hasMore)
  setLoadingMore(false)
}
```

### Scroll Detection

- Sentinel `<div ref={sentinelRef} />` at the end of the list/gallery
- `IntersectionObserver` watches sentinel:
  - If sentinel enters viewport AND `hasMore && !loadingMore` → call `loadMore()`
- A spinner `<CircularProgress>` shows at the bottom while `loadingMore` is true

### Filtering

Filters (Todos/Multimedia/Documentos) apply client-side over `allFiles` — no change needed.

### Components

- **FileGrid** and **FileList** — unchanged, receive `filteredFiles` as before
- **GroupFilesPage** — the only component modified (pagination logic + sentinel)

### Error Handling

- If a batch fails, show error message + retry button at bottom
- `loadingMore` set to false on error so user can retry
- Toast/alert for persistent failures

### Tests

- `files.test.ts`: verify `listFilesBatch` returns correct `FileResult` mapping and `hasMore` flag
- `GroupFilesPage.test.tsx`: verify initial load, `loadMore` on sentinel intersection, error state
- `electron.d.ts`: verify `loadMoreFiles` type declaration

## Files Changed

- `electron/main/telegram/files.ts` — add `listFilesBatch()`
- `electron/main/ipc.ts` — register `files:listMore` handler
- `electron/preload/index.ts` — expose `loadMoreFiles`
- `src/types/electron.d.ts` — add `loadMoreFiles` to `TelegramAPI`
- `src/pages/GroupFilesPage.tsx` — pagination state + sentinel observer
- `tests/unit/electron/telegram/files.test.ts` — test `listFilesBatch`
- `tests/unit/pages/GroupFilesPage.test.tsx` — test pagination

## Out of Scope

- Remove old `listFiles()` function (keep for backward compat until unused)
- Virtual scrolling (react-window) — can add later if performance degrades with 500+ files
- Server-side search/filter — all filtering is client-side
