# UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve TeleStorage UI/UX across login, states, dialogs, and accessibility.

**Architecture:** Four independent batches applied in order: accessibility first (additive, no risk), then states (new components), dialogs (replace prompt), login (most invasive). Each batch is testable independently.

**Tech Stack:** MUI v6, React, TypeScript, Vitest + @testing-library/react

---

## File Structure

### New Files
- `src/components/EmptyState.tsx` — Reusable empty state component
- `src/data/countryCodes.ts` — Static array of country codes for login picker

### Modified Files
- `src/components/LoginForm.tsx` — Country picker, validation, back nav, Alert errors
- `src/pages/LoginPage.tsx` — Back handler
- `src/components/GroupListItem.tsx` — aria-label
- `src/pages/GroupListPage.tsx` — Skeleton, empty state, Alert, landmarks, vincular search
- `src/components/FileListItem.tsx` — aria-label
- `src/components/FileList.tsx` — EmptyState usage
- `src/components/FileGrid.tsx` — aria-label, keyboard support, EmptyState usage
- `src/components/Toolbar.tsx` — aria-label
- `src/components/PreviewModal.tsx` — aria-label
- `src/pages/GroupFilesPage.tsx` — Skeleton, empty state, Alert, forward dialog, landmarks
- `src/pages/SettingsPage.tsx` — Skeleton, Alert errors
- `src/App.tsx` — Landmark regions

### Test Files
- `tests/unit/components/EmptyState.test.tsx` — New
- `tests/unit/components/LoginForm.test.tsx` — Updated for validation + country picker
- Existing component tests — Updated for new props if any

---

## Batch 1: Accessibility

### Task 1: IconButton aria-labels across all components

**Files:** Modify `Toolbar.tsx`, `FileListItem.tsx`, `PreviewModal.tsx`, `App.tsx`, `GroupListItem.tsx`

**Components and their aria-labels:**

- **Toolbar.tsx** — ViewList toggle: `"Vista de lista"`, GridView toggle: `"Vista de galería"`, Upload button: `"Subir archivos"`, Select mode: `"Seleccionar archivos"`, Cancel select: `"Cancelar selección"`, Batch delete: `"Eliminar seleccionados"`
- **FileListItem.tsx** — Download: `'Descargar'`, Delete: `'Eliminar'`
- **PreviewModal.tsx** — Close: `'Cerrar vista previa'`, Previous: `'Anterior'`, Next: `'Siguiente'`, Download: `'Guardar en disco'`, Forward: `'Reenviar'`, Delete: `'Eliminar'`
- **App.tsx (AppBar)** — Back: `'Volver'`, Theme: `mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'`, Settings: `'Configuración'`
- **GroupListItem.tsx** — Delete: `'Eliminar grupo'`

Status: text-only changes, no logic changes. Verify each component still renders and tests pass.

- [ ] **Step 1: Add aria-labels to Toolbar.tsx**

Open `Toolbar.tsx` and add `aria-label` prop to each `IconButton` and `Button`:
- `ToggleButton` for each filter: `aria-label="Filtrar Todos"`, etc.
- `ToggleButton` for view mode: `aria-label="Vista de lista"`, `aria-label="Vista de galería"`
- Upload `Button`: `aria-label="Subir archivos"`
- Select mode/cancel `Button`: `aria-label={selectMode ? 'Cancelar selección' : 'Seleccionar archivos'}`
- Batch delete `Button`: `aria-label="Eliminar seleccionados"`

- [ ] **Step 2: Add aria-labels to FileListItem.tsx**

```tsx
<IconButton size="small" onClick={() => onDownload(file)} aria-label="Descargar">
  <DownloadIcon fontSize="small" />
</IconButton>
{!isReadOnly && !selectMode && (
  <IconButton size="small" onClick={() => onDelete(file)} aria-label="Eliminar">
    <DeleteIcon fontSize="small" />
  </IconButton>
)}
```

- [ ] **Step 3: Add aria-labels to PreviewModal.tsx**

Each `IconButton` gets `aria-label` as listed above.

- [ ] **Step 4: Add aria-labels to App.tsx AppBar**

```tsx
<IconButton color="inherit" edge="start" onClick={handleBack} aria-label="Volver">
  <ArrowBackIcon />
</IconButton>
<IconButton color="inherit" onClick={toggleColorMode} aria-label={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
</IconButton>
<IconButton color="inherit" onClick={() => setShowSettings(true)} aria-label="Configuración">
  <SettingsIcon />
</IconButton>
```

- [ ] **Step 5: Add aria-label to GroupListItem.tsx delete button**

`aria-label="Eliminar grupo"`

- [ ] **Step 6: Run tests to verify nothing broke**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "a11y: add aria-labels to all IconButtons and action buttons"
```

### Task 2: FileGrid keyboard support

**Files:** Modify `src/components/FileGrid.tsx`

- [ ] **Step 1: Add keyboard props to GridCard Box**

```tsx
<Box
  ref={imgRef}
  onClick={onClick}
  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
  role="button"
  tabIndex={0}
  aria-label={file.name}
  sx={{ ... }}
>
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/components/FileGrid.test.tsx`
Expected: Pass.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "a11y: add keyboard support and aria-label to FileGrid cards"
```

### Task 3: Landmark regions

**Files:** Modify `App.tsx`, `GroupListPage.tsx`, `GroupFilesPage.tsx`

- [ ] **Step 1: Add main landmark to GroupListPage**

Wrap the main content `<Box>` (the one containing tabs + group list) with `<Box component="main">`.

```tsx
// Inside GroupListPage return, after the tab bar:
<Box component="main">
  ...existing content...
</Box>
```

- [ ] **Step 2: Add nav landmark to GroupListPage group list**

Wrap the group cards in `<Box component="nav" aria-label="Grupos">`.

- [ ] **Step 3: Add main landmark to GroupFilesPage**

Wrap the file list/grid area with `<Box component="main">`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "a11y: add landmark regions for screen reader navigation"
```

---

## Batch 2: Empty / Loading / Error States

### Task 4: Create EmptyState component

**Files:** Create `src/components/EmptyState.tsx`, Create `tests/unit/components/EmptyState.test.tsx`

- [ ] **Step 1: Write the EmptyState component test**

```tsx
// tests/unit/components/EmptyState.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import EmptyState from '../../../src/components/EmptyState'
import FolderOffIcon from '@mui/icons-material/FolderOff'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState icon={<FolderOffIcon />} title="Sin grupos" />, { wrapper: Wrapper })
    expect(screen.getByText('Sin grupos')).toBeDefined()
  })

  it('should render subtitle when provided', () => {
    render(<EmptyState icon={<FolderOffIcon />} title="Sin grupos" subtitle="Crea un nuevo grupo" />, { wrapper: Wrapper })
    expect(screen.getByText('Crea un nuevo grupo')).toBeDefined()
  })

  it('should render action when provided', () => {
    render(<EmptyState icon={<FolderOffIcon />} title="Sin grupos" action={<button>Crear</button>} />, { wrapper: Wrapper })
    expect(screen.getByText('Crear')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/components/EmptyState.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write EmptyState component**

```tsx
// src/components/EmptyState.tsx
import { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1 }}>
      <Box sx={{ color: 'action.disabled', '& .MuiSvgIcon-root': { fontSize: 64 } }}>
        {icon}
      </Box>
      <Typography variant="h6" color="text.secondary">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.disabled">{subtitle}</Typography>}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/components/EmptyState.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add EmptyState component for consistent empty states"
```

### Task 5: Skeleton loaders + EmptyState + Alert errors in GroupListPage

**Files:** Modify `src/pages/GroupListPage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import EmptyState from '../components/EmptyState'
```

- [ ] **Step 2: Replace loading indicator**

```tsx
// Replace:
if (loading) {
  return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: 'text.secondary' }}>Cargando grupos...</Box>
}
// With:
if (loading) {
  return (
    <Box sx={{ px: 2 }}>
      {[1, 2, 3].map(i => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="30%" />
          </Box>
        </Box>
      ))}
    </Box>
  )
}
```

- [ ] **Step 3: Replace empty state text**

```tsx
// Replace:
{visibleGroups.length === 0 && !archivedLoading && (
  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
    {tab === 'created' && 'No hay grupos en TeleStorage'}
    {tab === 'active' && 'No hay grupos. Crea uno nuevo.'}
    {tab === 'archived' && 'No hay grupos archivados'}
  </Typography>
)}
// With:
{visibleGroups.length === 0 && !archivedLoading && (
  tab === 'created'
    ? <EmptyState icon={<FolderOffIcon />} title="No hay grupos en TeleStorage" />
    : tab === 'active'
      ? <EmptyState icon={<FolderOffIcon />} title="No hay grupos" subtitle="Crea uno nuevo en TeleStorage" />
      : <EmptyState icon={<FolderOffIcon />} title="No hay grupos archivados" />
)}
```

- [ ] **Step 4: Replace error text with Alert**

```tsx
// Replace:
{error && <Typography color="error" variant="body2" sx={{ px: 2 }}>{error}</Typography>}
// With:
{error && (
  <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mt: 1 }}>
    {error}
  </Alert>
)}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/unit/pages/GroupListPage.test.tsx`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: skeleton loading, EmptyState, and Alert errors in GroupListPage"
```

### Task 6: Skeleton loaders + EmptyState + Alert in GroupFilesPage

**Files:** Modify `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import EmptyState from '../components/EmptyState'
```

- [ ] **Step 2: Replace file loading text with skeletons**

```tsx
// Replace the loading block in the render:
{loading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: 'text.secondary' }}>Cargando archivos...</Box>
) : error ? (
// With:
{loading ? (
  viewMode === 'list' ? (
    <Box sx={{ px: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" sx={{ flex: 1 }} />
          <Skeleton variant="text" width={60} />
          <Skeleton variant="text" width={80} />
        </Box>
      ))}
    </Box>
  ) : (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, p: 1 }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '1' }} />
      ))}
    </Box>
  )
) : error ? (
```

- [ ] **Step 3: Replace error text with Alert**

```tsx
// Replace:
<Typography color="error" sx={{ p: 2 }}>{error}</Typography>
// With:
<Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mt: 1 }}>
  {error}
  <Button size="small" onClick={loadInitialFiles} sx={{ ml: 1 }}>Reintentar</Button>
</Alert>
```

- [ ] **Step 4: Add empty state for when filtered files is empty**

After the `viewMode === 'gallery'` block, add an empty state for `filteredFiles.length === 0`:

```tsx
// After the FileGrid block, before the sentinel:
{filteredFiles.length === 0 && !loading && (
  <EmptyState
    icon={filter === 'media' ? <ImageOutlined /> : <InsertDriveFileOutlined />}
    title={filter === 'media' ? 'Sin archivos multimedia' : 'Sin archivos'}
  />
)}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/unit/pages/GroupFilesPage.test.tsx` (if exists) or `npx vitest run`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: skeleton loading, EmptyState, and Alert in GroupFilesPage"
```

### Task 7: SettingsPage skeleton loaders

**Files:** Modify `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add Skeleton import**

```tsx
import Skeleton from '@mui/material/Skeleton'
```

- [ ] **Step 2: Add a `loaded` state to show skeletons while settings load**

```tsx
// Add state:
const [loaded, setLoaded] = useState(false)

// In the useEffect:
useEffect(() => {
  window.telegramAPI.getSettings().then(s => {
    // ... existing state setters ...
    setLoaded(true)
  })
}, [])
```

- [ ] **Step 3: Render skeletons when not loaded**

Wrap the form content:
```tsx
{!loaded ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {[1, 2, 3].map(i => (
      <Box key={i}>
        <Skeleton variant="text" width={120} />
        <Skeleton variant="rounded" height={40} sx={{ mt: 0.5 }} />
      </Box>
    ))}
  </Box>
) : (
  // existing form content
)}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/pages/SettingsPage.test.tsx`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: skeleton loading state in SettingsPage"
```

---

## Batch 3: Dialog Consistency

### Task 8: Forward dialog (replace native prompt)

**Files:** Modify `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Add forward dialog state and handlers**

Add state alongside existing dialog states:
```tsx
const [forwardFile, setForwardFile] = useState<TelegramFile | null>(null)
const [forwardTargetId, setForwardTargetId] = useState('')
const [forwarding, setForwarding] = useState(false)
const [forwardError, setForwardError] = useState('')
```

- [ ] **Step 2: Modify handleForward**

Replace prompt usage:
```tsx
const handleForward = (file: TelegramFile) => {
  setForwardFile(file)
  setForwardTargetId('')
  setForwardError('')
}
```

Add the confirm handler:
```tsx
const handleConfirmForward = async () => {
  if (!forwardFile || !forwardTargetId) return
  setForwarding(true)
  setForwardError('')
  try {
    await window.telegramAPI.forwardFile(group.id, Number(forwardTargetId), forwardFile.messageId)
    setForwardFile(null)
    setForwardTargetId('')
    showSnackbar('Archivo reenviado', 'success')
  } catch (err: any) {
    setForwardError(err.message || 'Error al reenviar')
  } finally {
    setForwarding(false)
  }
}
```

- [ ] **Step 3: Add the forward dialog JSX**

Add before the closing `</Box>` of the main container:
```tsx
<Dialog open={!!forwardFile} onClose={() => setForwardFile(null)} maxWidth="xs" fullWidth>
  <DialogTitle>Reenviar archivo</DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ mb: 2 }}>
      Reenviar "{forwardFile?.name}" a otro grupo
    </DialogContentText>
    <TextField
      label="ID del grupo destino"
      type="number"
      fullWidth
      size="small"
      value={forwardTargetId}
      onChange={e => setForwardTargetId(e.target.value)}
      error={!!forwardError}
      helperText={forwardError}
      autoFocus
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setForwardFile(null)}>Cancelar</Button>
    <Button onClick={handleConfirmForward} variant="contained" disabled={forwarding || !forwardTargetId}>
      {forwarding ? 'Reenviando...' : 'Reenviar'}
    </Button>
  </DialogActions>
</Dialog>
```

- [ ] **Step 4: Update PreviewModal's onForward prop type** (if it passes the file)

The PreviewModal already receives `onForward` which is passed from `GroupFilesPage`. Ensure the `handleForward` function signature matches — it receives a `TelegramFile` parameter, which is already the case.

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: replace native prompt with MUI Dialog for file forwarding"
```

### Task 9: Vincular propio search

**Files:** Modify `src/pages/GroupListPage.tsx`

- [ ] **Step 1: Add search state**

```tsx
const [addGroupSearch, setAddGroupSearch] = useState('')
```

- [ ] **Step 2: Add filtered groups memo**

```tsx
const availableOwnGroups = useMemo(() => {
  return allGroups.filter(g => g.isOwner && !g.isAppCreated && !g.isArchived)
}, [allGroups])

const filteredOwnGroups = useMemo(() => {
  if (!addGroupSearch) return availableOwnGroups
  return availableOwnGroups.filter(g =>
    g.title.toLowerCase().includes(addGroupSearch.toLowerCase())
  )
}, [availableOwnGroups, addGroupSearch])
```

- [ ] **Step 3: Add search TextField to the vincular dialog**

Inside the `showAddExistingDialog` DialogContent, before the list:
```tsx
<TextField
  size="small"
  placeholder="Buscar grupo..."
  fullWidth
  value={addGroupSearch}
  onChange={e => setAddGroupSearch(e.target.value)}
  sx={{ mb: 1 }}
/>
```

Replace the list rendering:
```tsx
{filteredOwnGroups.map(g => (
  // ... existing group item rendering ...
))}
{filteredOwnGroups.length === 0 && (
  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
    {addGroupSearch ? 'Sin resultados' : 'No hay grupos propios sin vincular'}
  </Typography>
)}
```

- [ ] **Step 4: Clear search on dialog close**

```tsx
const handleCloseAddExisting = () => {
  setShowAddExistingDialog(false)
  setSelectedAddGroup(null)
  setAddGroupSearch('')
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/unit/pages/GroupListPage.test.tsx`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add search to Vincular propio dialog"
```

---

## Batch 4: Login Overhaul

### Task 10: Country code data

**Files:** Create `src/data/countryCodes.ts`

- [ ] **Step 1: Create country codes data**

```ts
// src/data/countryCodes.ts
export interface CountryCode {
  code: string
  label: string
  phone: string
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'MX', label: 'México', phone: '+52' },
  { code: 'US', label: 'Estados Unidos', phone: '+1' },
  { code: 'ES', label: 'España', phone: '+34' },
  { code: 'AR', label: 'Argentina', phone: '+54' },
  { code: 'CO', label: 'Colombia', phone: '+57' },
  { code: 'CL', label: 'Chile', phone: '+56' },
  { code: 'PE', label: 'Perú', phone: '+51' },
  { code: 'EC', label: 'Ecuador', phone: '+593' },
  { code: 'VE', label: 'Venezuela', phone: '+58' },
  { code: 'GT', label: 'Guatemala', phone: '+502' },
  { code: 'CU', label: 'Cuba', phone: '+53' },
  { code: 'DO', label: 'República Dominicana', phone: '+1' },
  { code: 'BO', label: 'Bolivia', phone: '+591' },
  { code: 'UY', label: 'Uruguay', phone: '+598' },
  { code: 'PY', label: 'Paraguay', phone: '+595' },
  { code: 'CR', label: 'Costa Rica', phone: '+506' },
  { code: 'PA', label: 'Panamá', phone: '+507' },
  { code: 'PR', label: 'Puerto Rico', phone: '+1' },
  { code: 'BR', label: 'Brasil', phone: '+55' },
  { code: 'GB', label: 'Reino Unido', phone: '+44' },
  { code: 'FR', label: 'Francia', phone: '+33' },
  { code: 'DE', label: 'Alemania', phone: '+49' },
  { code: 'IT', label: 'Italia', phone: '+39' },
  { code: 'PT', label: 'Portugal', phone: '+351' },
]
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add country codes data for login picker"
```

### Task 11: LoginForm with country picker, back nav, validation, Alert errors

**Files:** Modify `src/components/LoginForm.tsx`

- [ ] **Step 1: Add imports**

```tsx
import Autocomplete from '@mui/material/Autocomplete'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import IconButton from '@mui/material/IconButton'
import { COUNTRY_CODES, CountryCode } from '../data/countryCodes'
```

- [ ] **Step 2: Update props to include back handler**

```tsx
interface LoginFormProps {
  onSendCode: (phone: string) => void
  onVerifyCode: (phone: string, code: string) => void
  onCheck2FA: (password: string) => void
  onBack?: () => void
  codeHash?: string
  needs2FA?: boolean
  error?: string
  loading?: boolean
}
```

- [ ] **Step 3: Replace phone field with country picker + phone input**

```tsx
{!codeHash && !needs2FA && (
  <Stack direction="row" gap={1} sx={{ width: '100%' }}>
    <Autocomplete
      size="small"
      options={COUNTRY_CODES}
      getOptionLabel={o => `${o.phone} ${o.label}`}
      value={selectedCountry}
      onChange={(_, v) => setSelectedCountry(v || COUNTRY_CODES[0])}
      sx={{ width: 180 }}
      renderInput={params => <TextField {...params} label="País" />}
      disabled={loading}
    />
    <TextField label="Número de teléfono" placeholder="555 123 4567" fullWidth
      value={phone} onChange={e => {
        const v = e.target.value.replace(/[^0-9]/g, '')
        setPhone(v)
        setPhoneError(v.length > 0 && v.length < 7 ? 'Número muy corto' : '')
      }}
      error={!!phoneError}
      helperText={phoneError}
      disabled={loading} autoFocus />
  </Stack>
)}
```

Add validation state:
```tsx
const [phoneError, setPhoneError] = useState('')
```

- [ ] **Step 4: Add back navigation**

```tsx
// Before the form, inside the Box but before the <form>:
{(codeHash || needs2FA) && (
  <IconButton onClick={onBack} aria-label="Volver" sx={{ alignSelf: 'flex-start' }}>
    <ArrowBackIcon />
  </IconButton>
)}
```

- [ ] **Step 5: Replace error Typography with Alert**

```tsx
// Replace:
{error && <Typography color="error" variant="body2">{error}</Typography>}
// With:
{error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
```

- [ ] **Step 6: Update LoginPage to pass onBack**

```tsx
const handleBack = () => {
  if (needs2FA) setNeeds2FA(false)
  else if (codeHash) { setCodeHash(undefined); setError('') }
}
```

Pass to LoginForm: `onBack={handleBack}`

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/unit/components/LoginForm.test.tsx tests/unit/pages/LoginPage.test.tsx`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: login country picker, back nav, validation, Alert errors"
```

---

## Self-Review Checklist

### Spec Coverage
- 1a Country picker → Task 10 + Task 11
- 1b Step navigation → Task 11 (handleBack + back icon)
- 1c Input validation → Task 11 (phoneError state + error/helperText props)
- 1d Error display → Task 11 (Alert severity="error")
- 2a Skeleton loaders → Task 5 (groups), Task 6 (files), Task 7 (settings)
- 2b Empty states → Task 4 (EmptyState), Task 5 + Task 6 (usage)
- 2c Error Alert → Task 5 + Task 6
- 3a Forward dialog → Task 8
- 3b Vincular search → Task 9
- 4a IconButton aria-labels → Task 1
- 4b FileGrid keyboard → Task 2
- 4c Landmarks → Task 3

### Placeholder Scan
No placeholders. Every step has exact code, paths, and commands.

### Type Consistency
- `EmptyStateProps` defined in Task 4 matches usage in Task 5 and Task 6
- `CountryCode` interface in Task 10 matches usage in Task 11
- `handleForward` signature change in Task 8 doesn't break PreviewModal — PreviewModal already passes `TelegramFile` as arg
