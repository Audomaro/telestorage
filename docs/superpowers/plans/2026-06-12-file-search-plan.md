# File Search by Name/Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a search TextField to the Toolbar that filters files server-side via GramJS `getMessages({search})`.

**Architecture:** Two-layer filtering — (1) server-side `search` param narrows by name/text via Telegram API, (2) existing client-side type filters (Todos/Media/Documentos) apply on top. Search query is forwarded through IPC `files:listMore` → `listFilesBatch()`. 300ms debounce on keystroke prevents rapid API calls.

**Tech Stack:** Electron, GramJS (telegram), React, MUI v6, Vitest

---

### File Structure

| File | Change | Responsibility |
|------|--------|---------------|
| `electron/main/telegram/files.ts:152-165` | Add `search` param to `listFilesBatch` | Pass search to `client.getMessages()` |
| `electron/main/ipc.ts:88-91` | Forward `search` from IPC args | Extract search from `files:listMore` payload |
| `electron/preload/index.ts:48` | Forward `search` in `loadMoreFiles` | Accept search param in exposed API |
| `src/types/electron.d.ts:29` | Update `loadMoreFiles` signature | Type the `search` param |
| `src/components/Toolbar.tsx` | Add search TextField + debounce onChange prop | Render search input, emit debounced query |
| `src/pages/GroupFilesPage.tsx` | Add searchQuery state + pass to Toolbar + API | Wire search through load/reset/paginate cycle |

---

### Task 1: Backend `listFilesBatch` — add `search` param

**Files:**
- Modify: `electron/main/telegram/files.ts:152-165`

- [ ] **Step 1: Add `search` param to function signature and pass to `getMessages`**

```ts
export async function listFilesBatch(groupId: number, limit: number, offsetId?: number, search?: string): Promise<ListFilesBatchResult> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { limit, offsetId, search })

  const files: FileResult[] = messages
    .filter(m => m.media)
    .map(m => messageToFileResult(m, groupId))

  const nextOffsetId = messages.length > 0 ? messages[messages.length - 1].id : undefined

  return { files, hasMore: messages.length === limit, nextOffsetId }
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/main/telegram/files.ts
git commit -m "feat: add search param to listFilesBatch"
```

---

### Task 2: IPC handler — forward `search` from IPC args

**Files:**
- Modify: `electron/main/ipc.ts:88-91`

- [ ] **Step 1: Destructure `search` from args and pass to `listFilesBatch`**

```ts
ipcMain.handle('files:listMore', async (_event, { groupId, offsetId, search }: { groupId: number; offsetId?: number; search?: string }) => {
  const settings = getSettings()
  return listFilesBatch(groupId, settings.batchSize, offsetId, search)
})
```

- [ ] **Step 2: Commit**

```bash
git add electron/main/ipc.ts
git commit -m "feat: forward search param in files:listMore IPC"
```

---

### Task 3: Preload — forward `search` param in `loadMoreFiles`

**Files:**
- Modify: `electron/preload/index.ts:48`

- [ ] **Step 1: Add `search` param to `loadMoreFiles`**

```ts
loadMoreFiles: (groupId: number, offsetId?: number, search?: string) => ipcRenderer.invoke('files:listMore', { groupId, offsetId, search }),
```

- [ ] **Step 2: Commit**

```bash
git add electron/preload/index.ts
git commit -m "feat: forward search param in preload loadMoreFiles"
```

---

### Task 4: Types — update `loadMoreFiles` signature

**Files:**
- Modify: `src/types/electron.d.ts:29`

- [ ] **Step 1: Add `search` param to `loadMoreFiles`**

```ts
loadMoreFiles(groupId: number, offsetId?: number, search?: string): Promise<{ files: FileResult[]; hasMore: boolean; nextOffsetId?: number }>
```

- [ ] **Step 2: Commit**

```bash
git add src/types/electron.d.ts
git commit -m "feat: update loadMoreFiles type with search param"
```

---

### Task 5: Toolbar — add search TextField with debounced onChange

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Test: `tests/unit/components/Toolbar.test.tsx`

- [ ] **Step 1: Write failing test for search TextField**

```tsx
import TextField from '@mui/material/TextField'

// In the describe('Toolbar') block, add:
it('should render search field when viewMode is list', () => {
  render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} searchQuery="" onSearchChange={() => {}} />, { wrapper: Wrapper })
  expect(screen.getByPlaceholderText('Buscar archivos...')).toBeDefined()
})

it('should render search field when viewMode is gallery', () => {
  render(<Toolbar viewMode="gallery" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} searchQuery="" onSearchChange={() => {}} />, { wrapper: Wrapper })
  expect(screen.getByPlaceholderText('Buscar archivos...')).toBeDefined()
})

it('should call onSearchChange when typing in search field', () => {
  const onSearchChange = vi.fn()
  render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} searchQuery="" onSearchChange={onSearchChange} />, { wrapper: Wrapper })
  fireEvent.change(screen.getByPlaceholderText('Buscar archivos...'), { target: { value: 'test' } })
  expect(onSearchChange).toHaveBeenCalledWith('test')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/components/Toolbar.test.tsx`
Expected: FAIL — "property 'searchQuery' does not exist on type"

- [ ] **Step 3: Add search TextField to Toolbar**

Add import at top:
```tsx
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
```

Update interface:
```tsx
interface ToolbarProps {
  viewMode: ViewMode
  filter: FileFilter
  showUpload: boolean
  selectMode: boolean
  selectedCount: number
  onViewModeChange: (mode: ViewMode) => void
  onFilterChange: (filter: FileFilter) => void
  onUpload: () => void
  onToggleSelectMode: () => void
  onBatchDelete: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}
```

Add the search field between filter buttons and the spacer Box:
```tsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10 }}>
  {viewMode === 'list' && (
    <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, v) => v && onFilterChange(v)}>
      <ToggleButton value="all" aria-label="Filtrar Todos">Todos</ToggleButton>
      <ToggleButton value="media" aria-label="Filtrar Multimedia">Multimedia</ToggleButton>
      <ToggleButton value="documents" aria-label="Filtrar Documentos">Documentos</ToggleButton>
    </ToggleButtonGroup>
  )}
  <TextField
    size="small"
    placeholder="Buscar archivos..."
    value={searchQuery}
    onChange={e => onSearchChange(e.target.value)}
    slotProps={{
      input: {
        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
      }
    }}
    sx={{ minWidth: 200, '& .MuiInputBase-root': { fontSize: '0.875rem' } }}
  />
  <Box sx={{ flex: 1 }} />
  ...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/components/Toolbar.test.tsx`
Expected: PASS (all 5+ tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Toolbar.tsx tests/unit/components/Toolbar.test.tsx
git commit -m "feat: add search TextField to Toolbar with debounced onChange"
```

---

### Task 6: GroupFilesPage — wire searchQuery state through load/reset/paginate

**Files:**
- Modify: `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Add `searchQuery` state, refs, and wire to Toolbar props**

Add states and refs alongside existing ones:
```tsx
const [searchQuery, setSearchQuery] = useState('')
const initialLoadDone = useRef(false)
```

Update `loadInitialFiles` to accept optional search param:
```tsx
const loadInitialFiles = useCallback(async (query?: string) => {
  setAllFiles([])
  setHasMore(true)
  hasMoreRef.current = true
  setLoading(true)
  setError(null)
  try {
    const result = await window.telegramAPI.loadMoreFiles(group.id, undefined, query)
    setAllFiles(result.files)
    setHasMore(result.hasMore)
    hasMoreRef.current = result.hasMore
    offsetRef.current = result.nextOffsetId
  } catch (err: any) {
    setError(err.message || 'Error al cargar archivos')
  } finally {
    setLoading(false)
    initialLoadDone.current = true
  }
}, [group.id])
```

The `initialLoadDone` ref prevents the search debounce from double-loading on mount. The existing `useEffect(() => { loadInitialFiles() }, [loadInitialFiles])` handles the first load. Subsequent changes to `searchQuery` trigger the debounced reload.

- [ ] **Step 2: Add debounce effect to reload on searchQuery change** (after the existing `loadInitialFiles` mount effect)

```tsx
useEffect(() => {
  if (!initialLoadDone.current) return
  const timer = setTimeout(() => {
    loadInitialFiles(searchQuery || undefined)
  }, 300)
  return () => clearTimeout(timer)
}, [searchQuery, loadInitialFiles])
```

- [ ] **Step 3: Pass searchQuery to `handleLoadMore` and Toolbar**

Update `handleLoadMore`:
```tsx
const handleLoadMore = useCallback(async () => {
  if (loadingMoreRef.current || !hasMoreRef.current) return
  loadingMoreRef.current = true
  setLoadingMore(true)
  try {
    const result = await window.telegramAPI.loadMoreFiles(group.id, offsetRef.current, searchQuery || undefined)
    offsetRef.current = result.nextOffsetId
    setAllFiles(prev => [...prev, ...result.files])
    setHasMore(result.hasMore)
    hasMoreRef.current = result.hasMore
  } catch (err: any) {
    setError(err.message || 'Error al cargar más archivos')
  } finally {
    loadingMoreRef.current = false
    setLoadingMore(false)
  }
}, [group.id, searchQuery])
```

Add `searchQuery` and `onSearchChange` to Toolbar props:
```tsx
<Toolbar
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  filter={filter}
  onFilterChange={setFilter}
  onUpload={() => setShowUpload(true)}
  showUpload={group.isOwner}
  selectMode={selectMode}
  selectedCount={selectedIds.size}
  onToggleSelectMode={handleToggleSelectMode}
  onBatchDelete={() => setConfirmBatchDelete(true)}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/GroupFilesPage.tsx
git commit -m "feat: wire searchQuery in GroupFilesPage with debounced load"
```

---

### Task 7: Verify build succeeds

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck:web`
Expected: PASS (no errors)

Run: `npm run typecheck:node`
Expected: PASS (no errors)

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: all 106+ tests pass

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: typecheck/test adjustments for search feature"
```
