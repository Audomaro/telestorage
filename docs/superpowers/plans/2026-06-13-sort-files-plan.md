# Sort Files by Name/Size/Date/Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side sorting of files by name, size, date, and type in both list mode (clickable table headers) and gallery mode (toolbar dropdown).

**Architecture:** Pure frontend — no backend changes. `SortField` and `SortDirection` types, state in `GroupFilesPage`, `useMemo` sorting after filtering. List mode uses MUI `TableSortLabel` on `FileList.tsx`. Gallery mode uses MUI `Select` dropdown + direction toggle in `Toolbar.tsx`.

**Tech Stack:** React, MUI v6, Vitest

---

### File Structure

| File | Change | Responsibility |
|------|--------|---------------|
| `src/types/index.ts` | Add `SortField` + `SortDirection` types | Shared type definitions |
| `src/components/FileList.tsx` | Add `sortField`/`sortDirection`/`onSort` props, `TableSortLabel` on headers | Sortable list table |
| `src/components/Toolbar.tsx` | Add sort `Select` + direction toggle for gallery mode | Sort controls in toolbar |
| `src/pages/GroupFilesPage.tsx` | Add `sortField`/`sortDirection` state, `useMemo` sorting logic | State + wiring |

---

### Task 1: Add `SortField` and `SortDirection` types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add types after `FileFilter`**

```ts
export type SortField = 'name' | 'size' | 'date' | 'type'
export type SortDirection = 'asc' | 'desc'
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add SortField and SortDirection types"
```

---

### Task 2: FileList — add sortable headers with TableSortLabel

**Files:**
- Modify: `src/components/FileList.tsx`

- [ ] **Step 1: Update imports and props, add `TableSortLabel` to headers**

```tsx
import TableSortLabel from '@mui/material/TableSortLabel'
import { TelegramFile, SortField, SortDirection } from '../types'

interface FileListProps {
  files: TelegramFile[]
  isReadOnly: boolean
  selectMode: boolean
  selectedIds: Set<number>
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  onToggleSelect: (file: TelegramFile) => void
  onPreview?: (file: TelegramFile) => void
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}
```

Replace the header row cells (lines 29-35):
```tsx
<TableHead>
  <TableRow>
    {selectMode && <TableCell sx={{ width: 36, p: 0.5, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }} />}
    <TableCell sx={{ width: 36, p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }} />
    <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
      <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDirection : 'asc'} onClick={() => onSort('name')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
        Nombre
      </TableSortLabel>
    </TableCell>
    <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
      <TableSortLabel active={sortField === 'size'} direction={sortField === 'size' ? sortDirection : 'asc'} onClick={() => onSort('size')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
        Tamaño
      </TableSortLabel>
    </TableCell>
    <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
      <TableSortLabel active={sortField === 'date'} direction={sortField === 'date' ? sortDirection : 'asc'} onClick={() => onSort('date')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
        Fecha
      </TableSortLabel>
    </TableCell>
    <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
      <TableSortLabel active={sortField === 'type'} direction={sortField === 'type' ? sortDirection : 'asc'} onClick={() => onSort('type')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
        Tipo
      </TableSortLabel>
    </TableCell>
  </TableRow>
</TableHead>
```

- [ ] **Step 2: Update FileList test with new required props**

```tsx
// tests/unit/components/FileList.test.tsx line 18 and line 24
// Add sortField, sortDirection, onSort props:
render(<FileList files={mockFiles} isReadOnly={false} onDownload={() => {}} onDelete={() => {}} selectMode={false} selectedIds={new Set()} onToggleSelect={() => {}} sortField="name" sortDirection="asc" onSort={() => {}} />, { wrapper: Wrapper })
// ... same fix on line 24 for the empty state test
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FileList.tsx tests/unit/components/FileList.test.tsx
git commit -m "feat: add sortable headers with TableSortLabel to FileList"
```

---

### Task 3: Toolbar — add sort dropdown for gallery mode

**Files:**
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 1: Add imports and props**

```tsx
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { ViewMode, FileFilter, SortField, SortDirection } from '../types'
```

Add to `ToolbarProps` (optional with defaults so existing tests don't break):
```tsx
  sortField?: SortField
  sortDirection?: SortDirection
  onSortChange?: (field: SortField) => void
  onSortDirectionToggle?: () => void
```

Add defaults inside the component:
```tsx
const activeSortField = sortField ?? 'name'
const activeSortDir = sortDirection ?? 'asc'
```

- [ ] **Step 2: Add sort controls between search field and spacer**

After the search TextField and before `<Box sx={{ flex: 1 }} />`, add:
```tsx
<FormControl size="small" sx={{ minWidth: 120 }}>
  <Select
    value={activeSortField}
    onChange={e => onSortChange?.(e.target.value as SortField)}
    displayEmpty
    sx={{ fontSize: '0.8rem', borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,136,204,0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0088cc' } }}
  >
    <MenuItem value="name" sx={{ fontSize: '0.8rem' }}>Nombre</MenuItem>
    <MenuItem value="size" sx={{ fontSize: '0.8rem' }}>Tamaño</MenuItem>
    <MenuItem value="date" sx={{ fontSize: '0.8rem' }}>Fecha</MenuItem>
    <MenuItem value="type" sx={{ fontSize: '0.8rem' }}>Tipo</MenuItem>
  </Select>
</FormControl>
<IconButton size="small" onClick={onSortDirectionToggle} aria-label={activeSortDir === 'asc' ? 'Orden ascendente' : 'Orden descendente'}>
  {activeSortDir === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
</IconButton>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: add sort dropdown and direction toggle to Toolbar"
```

---

### Task 4: GroupFilesPage — add sort state + useMemo sorting logic

**Files:**
- Modify: `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Import types and add sort state**

```tsx
import { TelegramFile, ViewMode, FileFilter, SortField, SortDirection } from '../types'
```

Add alongside existing states:
```tsx
const [sortField, setSortField] = useState<SortField>('name')
const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
```

- [ ] **Step 2: Add sortedFiles useMemo after filtering**

Wherever the filtered list is derived (search for `filteredFiles` or compute it), add sort:

```tsx
const sortedFiles = useMemo(() => {
  const list = filteredFiles // or wherever the filtered list comes from
  return [...list].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'size':
        cmp = a.size - b.size
        break
      case 'date':
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case 'type':
        cmp = a.mimeType.localeCompare(b.mimeType)
        break
    }
    return sortDirection === 'asc' ? cmp : -cmp
  })
}, [filteredFiles, sortField, sortDirection])
```

- [ ] **Step 3: Wire sort handlers and pass to FileList/Toolbar**

```tsx
const handleSort = useCallback((field: SortField) => {
  setSortField(prev => {
    if (prev === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
      return prev
    }
    setSortDirection('asc')
    return field
  })
}, [])

const handleSortDirectionToggle = useCallback(() => {
  setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
}, [])
```

Pass `sortedFiles` instead of `filteredFiles` to FileList and FileGrid.

Pass sort props:
```tsx
<FileList
  files={sortedFiles}
  ...
  sortField={sortField}
  sortDirection={sortDirection}
  onSort={handleSort}
/>

<Toolbar
  ...
  sortField={sortField}
  sortDirection={sortDirection}
  onSortChange={handleSort}
  onSortDirectionToggle={handleSortDirectionToggle}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/GroupFilesPage.tsx
git commit -m "feat: add sort state and useMemo sorting to GroupFilesPage"
```

---

### Task 5: Verify all tests pass

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck:web
```
Expected: PASS (no errors)

```bash
npm run typecheck:node
```
Expected: PASS (no errors)

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: all tests pass (update any test that constructs `FileList` or `Toolbar` without the new required props)

- [ ] **Step 3: Commit any test fixes**

```bash
git add -A
git commit -m "fix: update tests for sort props"
```
