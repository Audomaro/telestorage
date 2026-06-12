# Infinite Scroll Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Paginate file listing in batches of 50 with infinite scroll for list and gallery views.

**Architecture:** Backend adds `listFilesBatch(groupId, limit, offsetId?)` that wraps `client.getMessages()` with pagination. IPC exposes `files:listMore`. Frontend accumulates files in state, uses IntersectionObserver sentinel to trigger next batch, filters client-side.

**Tech Stack:** GramJS `getMessages(limit, offsetId)`, Electron IPC, React useState/useEffect, IntersectionObserver

---

### Task 1: Add `listFilesBatch` to files.ts

**Files:**
- Modify: `electron/main/telegram/files.ts`
- Test: `tests/unit/electron/telegram/files.test.ts`

- [ ] **Step 1: Write the failing test**

Add after existing file tests in `tests/unit/electron/telegram/files.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'

describe('listFilesBatch', () => {
  it('should be a function', () => {
    expect(typeof listFilesBatch).toBe('function')
  })
})
```

Add `listFilesBatch` to the import at the top.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/electron/telegram/files.test.ts`
Expected: FAIL, `listFilesBatch is not defined`

- [ ] **Step 3: Write minimal implementation**

In `electron/main/telegram/files.ts`, add the export:

```ts
export interface ListFilesBatchResult {
  files: FileResult[]
  hasMore: boolean
}

export async function listFilesBatch(groupId: number, limit: number, offsetId?: number): Promise<ListFilesBatchResult> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { limit, offsetId })

  const files: FileResult[] = messages
    .filter(m => m.media)
    .map(m => {
      let name = 'unknown'
      let size = 0
      let mimeType = 'application/octet-stream'

      const media = m.media as any
      if (media?.document) {
        const attrs = media.document.attributes || []
        const fileNameAttr = attrs.find((a: any) => a.className === 'DocumentAttributeFilename')
        name = fileNameAttr?.fileName || `file_${m.id}`
        size = Number(media.document.size) || 0
        mimeType = media.document.mimeType || 'application/octet-stream'
      } else if (media?.photo) {
        name = `photo_${m.id}.jpg`
        mimeType = 'image/jpeg'
        const sizes = media.photo.sizes || []
        size = sizes.reduce((max: number, s: any) => {
          const sSize = typeof s.size === 'number' ? s.size : 0
          return sSize > max ? sSize : max
        }, 0)
      }

      return {
        id: m.id, messageId: m.id, name, size, mimeType,
        date: new Date(m.date * 1000), groupId,
        thumbnail: extractThumbnail(media)
      }
    })

  return { files, hasMore: messages.length === limit }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/electron/telegram/files.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add electron/main/telegram/files.ts tests/unit/electron/telegram/files.test.ts
git commit -m "feat: add listFilesBatch for paginated message loading"
```

---

### Task 2: Wire IPC + Preload + Types

**Files:**
- Modify: `electron/main/ipc.ts`
- Modify: `electron/preload/index.ts`
- Modify: `src/types/electron.d.ts`

- [ ] **Step 1: Register `files:listMore` IPC handler**

In `electron/main/ipc.ts`:

Add to the import: `listFilesBatch`
Add after the `files:download` handler:

```ts
ipcMain.handle('files:listMore', async (_event, { groupId, offsetId }: { groupId: number; offsetId?: number }) => {
  return listFilesBatch(groupId, 50, offsetId)
})
```

- [ ] **Step 2: Expose in preload**

In `electron/preload/index.ts`, add inside the `telegramAPI` object:

```ts
loadMoreFiles: (groupId: number, offsetId?: number) => ipcRenderer.invoke('files:listMore', { groupId, offsetId }),
```

- [ ] **Step 3: Add type declaration**

In `src/types/electron.d.ts`, add to the `TelegramAPI` interface:

```ts
loadMoreFiles(groupId: number, offsetId?: number): Promise<{ files: FileResult[]; hasMore: boolean }>
```

- [ ] **Step 4: Commit**

```bash
git add electron/main/ipc.ts electron/preload/index.ts src/types/electron.d.ts
git commit -m "feat: wire files:listMore IPC handler through preload"
```

---

### Task 3: Update GroupFilesPage with infinite scroll

**Files:**
- Modify: `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Add pagination state and loadMore logic**

In `GroupFilesPage.tsx`, add new state variables after existing `useState` declarations:

```tsx
const [allFiles, setAllFiles] = useState<FileResult[]>([])
const [hasMore, setHasMore] = useState(true)
const [loadingMore, setLoadingMore] = useState(false)
const sentinelRef = useRef<HTMLDivElement>(null)
```

Replace the existing initial load `useEffect` (which currently calls `listFiles`) with a paginated version. If current code is:

```tsx
// existing fetch logic
```

Replace with:

```tsx
const [allFilesLoaded, setAllFilesLoaded] = useState(false)

useEffect(() => {
  setAllFiles([])
  setHasMore(true)
  setAllFilesLoaded(false)
  loadMoreFiles()
    .then(result => {
      setAllFiles(result.files)
      setHasMore(result.hasMore)
      setAllFilesLoaded(true)
    })
    .catch(err => {
      setError(err.message)
      setAllFilesLoaded(true)
    })
}, [group.id])

async function loadMoreFiles(offsetId?: number): Promise<{ files: FileResult[]; hasMore: boolean }> {
  return window.telegramAPI.loadMoreFiles(group.id, offsetId)
}

async function handleLoadMore() {
  if (loadingMore || !hasMore) return
  setLoadingMore(true)
  try {
    const lastFile = allFiles[allFiles.length - 1]
    const result = await loadMoreFiles(lastFile?.messageId)
    setAllFiles(prev => [...prev, ...result.files])
    setHasMore(result.hasMore)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoadingMore(false)
  }
}
```

- [ ] **Step 2: Add IntersectionObserver sentinel**

In the component body, after the `loadMore` functions:

```tsx
useEffect(() => {
  const el = sentinelRef.current
  if (!el) return

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore && !loadingMore) {
      handleLoadMore()
    }
  }, { rootMargin: '200px' })

  observer.observe(el)
  return () => observer.disconnect()
}, [hasMore, loadingMore])
```

- [ ] **Step 3: Filter from `allFiles` instead of a direct API call**

Find where `filteredFiles` is computed. Replace the source from an API-based fetch to use `allFiles`:

Current (likely):
```tsx
const [files, setFiles] = useState<FileResult[]>([])
```

Change filtering to derive from `allFiles`:

```tsx
const filteredFiles = useMemo(() => {
  let result = allFiles
  if (activeFilter === 'multimedia') {
    result = result.filter(f => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'))
  } else if (activeFilter === 'documentos') {
    result = result.filter(f => !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('video/'))
  }
  return result
}, [allFiles, activeFilter])
```

Replace any `files` state usage with `allFiles` to avoid dual state. Remove `files` state entirely.

- [ ] **Step 4: Add sentinel div and loading indicator at the bottom**

After the list/gallery and before the closing `</div>` of the content area:

```tsx
{hasMore && (
  <div ref={sentinelRef} className={styles.sentinel}>
    {loadingMore && <CircularProgress size={30} progress={0} />}
  </div>
)}
```

- [ ] **Step 5: Add sentinel styles**

In `src/pages/GroupFilesPage.module.css`, add:

```css
.sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  min-height: 48px;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/GroupFilesPage.tsx src/pages/GroupFilesPage.module.css
git commit -m "feat: implement infinite scroll with 50-file batches in GroupFilesPage"
```

---

### Task 4: Verify build and tests

**Files:**
- All modified files

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All pass

- [ ] **Step 2: Run build**

Run: `npx electron-vite build`
Expected: Clean build

- [ ] **Step 3: Commit any fixups**

```bash
git commit -am "chore: fix test and build after pagination changes"
```
