# MUI UX/UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate TeleStorage from raw CSS Modules to full Material UI v6 with light/dark theme, Material icons replacing emojis, and Snackbar-based notifications.

**Architecture:** MUI ThemeProvider wraps the app; ColorModeContext provides light/dark toggle via AppBar button; SnackbarContext provides toast notifications replacing all `alert()` calls. Components migrate to MUI equivalents (Dialog, Table, ImageList, Tabs, etc.).

**Tech Stack:** `@mui/material` v6, `@mui/icons-material` v6, `@emotion/react`, `@emotion/styled`, React 18, TypeScript

---

### Task 1: Install Dependencies + Theme Infrastructure

**Files:**
- Create: `src/theme/theme.ts`
- Create: `src/theme/ColorModeContext.tsx`
- Create: `src/theme/SnackbarContext.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install MUI dependencies**

Run:
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```
Expected: packages added to `package.json`

- [ ] **Step 2: Create theme file**

Create `src/theme/theme.ts`:

```tsx
import { createTheme } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: '#607D8B', light: '#78909C', dark: '#455A64' },
    secondary: { main: '#78909C' },
    ...(mode === 'dark' ? {
      background: { default: '#121212', paper: '#1e1e1e' },
      text: { primary: '#e0e0e0', secondary: '#9e9e9e' },
      divider: '#333333',
    } : {
      background: { default: '#f5f5f5', paper: '#ffffff' },
      text: { primary: '#212121', secondary: '#616161' },
      divider: '#e0e0e0',
    }),
    error: { main: mode === 'dark' ? '#ef5350' : '#e53935' },
    warning: { main: mode === 'dark' ? '#FFA726' : '#FF9800' },
    success: { main: mode === 'dark' ? '#66BB6A' : '#4CAF50' },
    info: { main: mode === 'dark' ? '#42A5F5' : '#2196F3' },
  },
  shape: { borderRadius: 8 },
  typography: { fontSize: 14 },
})
```

- [ ] **Step 3: Create ColorModeContext**

Create `src/theme/ColorModeContext.tsx`:

```tsx
import { createContext, useContext, useState, ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getTheme } from './theme'

interface ColorModeContextValue {
  mode: 'light' | 'dark'
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
})

export const useColorMode = () => useContext(ColorModeContext)

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const toggleColorMode = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'))
  const theme = getTheme(mode)

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
```

- [ ] **Step 4: Create SnackbarContext**

Create `src/theme/SnackbarContext.tsx`:

```tsx
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { AlertColor } from '@mui/material/Alert'

interface SnackbarState {
  open: boolean
  message: string
  severity: AlertColor
}

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: AlertColor) => void
}

const SnackbarContext = createContext<SnackbarContextValue>({
  showSnackbar: () => {},
})

export const useSnackbar = () => useContext(SnackbarContext)

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false, message: '', severity: 'info',
  })

  const showSnackbar = useCallback((message: string, severity: AlertColor = 'info') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/theme/ package.json package-lock.json
git commit -m "feat: add MUI deps, theme, ColorModeProvider, SnackbarProvider"
```

---

### Task 2: Rewrite App.tsx with ThemeProvider + AppBar

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite App.tsx**

Replace entire content:

```tsx
import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import LoginPage from './pages/LoginPage'
import GroupListPage from './pages/GroupListPage'
import GroupFilesPage from './pages/GroupFilesPage'
import SettingsPage from './pages/SettingsPage'
import { TelegramGroup } from './types'
import { ColorModeProvider, useColorMode } from './theme/ColorModeContext'
import { SnackbarProvider } from './theme/SnackbarContext'

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const { mode, toggleColorMode } = useColorMode()

  useEffect(() => {
    window.telegramAPI.init()
      .then((result) => { setIsLoggedIn(result.initialized); setChecking(false) })
      .catch(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'text.secondary' }}>
        Conectando...
      </Box>
    )
  }

  const handleBack = () => {
    if (showSettings) setShowSettings(false)
    else if (selectedGroup) setSelectedGroup(null)
  }

  const showBack = showSettings || !!selectedGroup

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isLoggedIn && (
        <AppBar position="sticky" elevation={1}>
          <Toolbar variant="dense">
            {showBack && (
              <IconButton color="inherit" edge="start" onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 0, mr: 2 }}>
              TeleStorage
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton color="inherit" onClick={toggleColorMode}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton color="inherit" onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {!isLoggedIn
          ? <LoginPage onLogin={() => setIsLoggedIn(true)} />
          : showSettings
            ? <SettingsPage onBack={() => setShowSettings(false)} />
            : selectedGroup
              ? <GroupFilesPage group={selectedGroup} onBack={() => setSelectedGroup(null)}
                  onSettings={() => setShowSettings(true)} />
              : <GroupListPage onSelectGroup={setSelectedGroup} onSettings={() => setShowSettings(true)} />
        }
      </Box>
    </Box>
  )
}

export default function App() {
  return (
    <ColorModeProvider>
      <SnackbarProvider>
        <AppContent />
      </SnackbarProvider>
    </ColorModeProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: App.tsx with MUI ThemeProvider, AppBar, Snackbar"
```

---

### Task 3: Migrate LoginForm

**Files:**
- Modify: `src/components/LoginForm.tsx`
- Modify: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Rewrite LoginForm with MUI**

Replace `src/components/LoginForm.tsx`:

```tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import StorageIcon from '@mui/icons-material/Storage'

interface LoginFormProps {
  step: 'phone' | 'code' | '2fa'
  phone: string
  codeHash: string
  error: string
  loading: boolean
  onPhoneChange: (v: string) => void
  onCodeChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: () => void
}

export default function LoginForm({
  step, phone, error, loading, onPhoneChange, onCodeChange, onPasswordChange, onSubmit,
}: LoginFormProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', px: 2 }}>
      <StorageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
      <Typography variant="h5" gutterBottom>TeleStorage</Typography>
      <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {step === 'phone' && (
          <TextField label="Número de teléfono" placeholder="+52 555 123 4567" fullWidth
            value={phone} onChange={e => onPhoneChange(e.target.value)}
            disabled={loading} autoFocus />
        )}
        {step === 'code' && (
          <>
            <Typography variant="body2" color="text.secondary">
              Enviamos un código a {phone}
            </Typography>
            <TextField label="Código de verificación" placeholder="Código" fullWidth
              onChange={e => onCodeChange(e.target.value)} disabled={loading} autoFocus />
          </>
        )}
        {step === '2fa' && (
          <>
            <Typography variant="body2" color="text.secondary">
              Tu cuenta tiene verificación en dos pasos
            </Typography>
            <TextField label="Contraseña 2FA" type="password" placeholder="Contraseña" fullWidth
              onChange={e => onPasswordChange(e.target.value)} disabled={loading} autoFocus />
          </>
        )}
        {error && (
          <Typography color="error" variant="body2">{error}</Typography>
        )}
        <Button variant="contained" fullWidth onClick={onSubmit} disabled={loading} sx={{ mt: 1 }}>
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {loading ? 'Procesando...' : step === 'phone' ? 'Enviar código' : step === 'code' ? 'Verificar código' : 'Iniciar sesión'}
        </Button>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Update LoginPage to pass the same props (no structural change)**

`src/pages/LoginPage.tsx` keeps its current logic; only the rendered component changes. No changes to LoginPage needed — it imports LoginForm and passes props, which still match.

- [ ] **Step 3: Delete LoginForm CSS module**

Delete `src/components/LoginForm.module.css`

- [ ] **Step 4: Commit**

```bash
git add src/components/LoginForm.tsx src/pages/LoginPage.tsx
git rm src/components/LoginForm.module.css
git commit -m "refactor: LoginForm to MUI components"
```

---

### Task 4: Migrate GroupListItem to MUI

**Files:**
- Modify: `src/components/GroupListItem.tsx`

- [ ] **Step 1: Rewrite GroupListItem with MUI**

Replace `src/components/GroupListItem.tsx`:

```tsx
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GroupIcon from '@mui/icons-material/Group'
import { TelegramGroup } from '../types'

interface GroupListItemProps {
  group: TelegramGroup
  onClick: (group: TelegramGroup) => void
  onDelete?: (group: TelegramGroup) => void
}

function getInitials(title: string): string {
  return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function GroupListItem({ group, onClick, onDelete }: GroupListItemProps) {
  return (
    <Card sx={{ mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Avatar sx={{ bgcolor: group.isOwner ? 'primary.main' : '#FF9800', width: 40, height: 40, fontSize: 16 }}>
          {getInitials(group.title)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap>{group.title}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={group.isOwner ? 'Propio' : 'Tercero'}
              color={group.isOwner ? 'primary' : 'warning'}
              size="small"
              icon={group.isOwner ? <CheckCircleIcon /> : <GroupIcon />}
            />
            {!group.isOwner && (
              <Chip label="Solo lectura" variant="outlined" size="small" />
            )}
            {group.isArchived && (
              <Chip label="Archivado" variant="outlined" size="small" />
            )}
          </Box>
        </Box>
        {onDelete && group.isOwner && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); onDelete(group) }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </CardContent>
    </Card>
  )
}
```

Note: Add `import Box from '@mui/material/Box'` — already covered by MUI import.

- [ ] **Step 2: Delete CSS module**

Delete `src/components/GroupListItem.module.css`

- [ ] **Step 3: Commit**

```bash
git add src/components/GroupListItem.tsx
git rm src/components/GroupListItem.module.css
git commit -m "refactor: GroupListItem to MUI Card/Avatar/Chip"
```

---

### Task 5: Migrate GroupListPage to MUI

**Files:**
- Modify: `src/pages/GroupListPage.tsx`
- Delete: `src/pages/GroupListPage.module.css`
- Delete: `src/components/ConfirmDialog.tsx`
- Delete: `src/components/ConfirmDialog.module.css`

- [ ] **Step 1: Rewrite GroupListPage with MUI**

Replace `src/pages/GroupListPage.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import LinkIcon from '@mui/icons-material/Link'
import { TelegramGroup } from '../types'
import GroupListItem from '../components/GroupListItem'
import { useSnackbar } from '../theme/SnackbarContext'

const TAB_KEY = 'telestorage:groupTab'
let _sessionFirstMount = true

function loadSavedTab(): 'created' | 'active' | 'archived' {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    if (saved === 'created' || saved === 'active' || saved === 'archived') return saved
  } catch {}
  return 'created'
}

function saveTab(tab: 'created' | 'active' | 'archived') {
  try { localStorage.setItem(TAB_KEY, tab) } catch {}
}

interface GroupListPageProps {
  onSelectGroup?: (group: TelegramGroup) => void
  onSettings?: () => void
}

export default function GroupListPage({ onSelectGroup, onSettings }: GroupListPageProps) {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [archived, setArchived] = useState<TelegramGroup[]>([])
  const [tab, setTab] = useState<'created' | 'active' | 'archived'>(loadSavedTab)
  const [loading, setLoading] = useState(true)
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingGroup, setDeletingGroup] = useState<TelegramGroup | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const createInputRef = useRef<HTMLInputElement>(null)
  const [showAddExistingDialog, setShowAddExistingDialog] = useState(false)
  const [selectedAddGroup, setSelectedAddGroup] = useState<TelegramGroup | null>(null)
  const [addingGroup, setAddingGroup] = useState(false)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    loadGroups()
    if (tab === 'archived') loadArchived()
  }, [])

  useEffect(() => {
    if (_sessionFirstMount) {
      _sessionFirstMount = false
      window.telegramAPI.getSettings().then(s => {
        const dt = s.defaultTab ?? 'created'
        setTab(dt)
        saveTab(dt)
        if (dt === 'archived') loadArchived()
      })
    }
  }, [])

  const loadGroups = async () => {
    setLoading(true)
    setError('')
    try {
      const g = await window.telegramAPI.getGroups()
      setGroups(g)
    } catch (err: any) {
      setError(err.message || 'Error al cargar grupos')
    } finally {
      setLoading(false)
    }
  }

  const loadArchived = async () => {
    if (archived.length > 0) return
    setArchivedLoading(true)
    try {
      const a = await window.telegramAPI.getArchivedGroups()
      setArchived(a)
    } catch (err: any) {
      setError(err.message || 'Error al cargar grupos archivados')
    } finally {
      setArchivedLoading(false)
    }
  }

  const handleTabChange = (_: any, newTab: number) => {
    const labels: ('created' | 'active' | 'archived')[] = ['created', 'active', 'archived']
    const t = labels[newTab]
    setTab(t)
    saveTab(t)
    if (t === 'archived') loadArchived()
    else loadGroups()
  }

  const handleConfirmAddExisting = async () => {
    if (!selectedAddGroup || addingGroup) return
    setAddingGroup(true)
    try {
      await window.telegramAPI.addToCreatedGroup(selectedAddGroup.id)
      setShowAddExistingDialog(false)
      setSelectedAddGroup(null)
      loadGroups()
    } catch (err: any) {
      showSnackbar(err.message || 'Error al vincular grupo', 'error')
    } finally {
      setAddingGroup(false)
    }
  }

  const handleConfirmCreate = async () => {
    if (!newGroupName.trim() || creating) return
    setCreating(true)
    try {
      await window.telegramAPI.createGroup(newGroupName.trim())
      setShowCreateDialog(false)
      setNewGroupName('')
      loadGroups()
    } catch (err: any) {
      showSnackbar(err.message || 'Error al crear grupo', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return
    setDeleting(true)
    try {
      await window.telegramAPI.deleteGroup(deletingGroup.id)
      setDeletingGroup(null)
      loadGroups()
      setArchived(prev => prev.filter(g => g.id !== deletingGroup.id))
    } catch (err: any) {
      showSnackbar(err.message || 'Error al eliminar grupo', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const allGroups = [...groups, ...archived]
  const visibleGroups = tab === 'created'
    ? allGroups.filter(g => g.isAppCreated && !g.isArchived)
    : tab === 'active'
      ? allGroups.filter(g => !g.isArchived)
      : allGroups.filter(g => g.isArchived)

  const tabIndex = tab === 'created' ? 0 : tab === 'active' ? 1 : 2

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: 'text.secondary' }}>Cargando grupos...</Box>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 1 }}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="TeleStorage" />
          <Tab label="Activos" />
          <Tab label="Archivados" />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        {onSettings && (
          <Button size="small" onClick={onSettings}>Configuración</Button>
        )}
      </Box>
      {tab === 'created' && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={() => setShowAddExistingDialog(true)}>
            + Vincular propio
          </Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { setShowCreateDialog(true); setTimeout(() => createInputRef.current?.focus(), 50) }}>
            + Nuevo grupo
          </Button>
        </Box>
      )}
      {error && <Typography color="error" variant="body2" sx={{ px: 2 }}>{error}</Typography>}
      <Box sx={{ px: 2 }}>
        {visibleGroups.map(g => (
          <GroupListItem key={g.id} group={g} onClick={(grp) => onSelectGroup?.(grp)} onDelete={(grp) => setDeletingGroup(grp)} />
        ))}
        {visibleGroups.length === 0 && !archivedLoading && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {tab === 'created' && 'No hay grupos en TeleStorage'}
            {tab === 'active' && 'No hay grupos. Crea uno nuevo con "+ Nuevo grupo".'}
            {tab === 'archived' && 'No hay grupos archivados'}
          </Typography>
        )}
        {tab === 'archived' && archivedLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {/* Create group dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Nuevo grupo</DialogTitle>
        <DialogContent>
          <TextField inputRef={createInputRef} placeholder="Nombre del grupo" fullWidth sx={{ mt: 1 }}
            value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirmCreate() }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmCreate} variant="contained" disabled={creating || !newGroupName.trim()}>
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link own group dialog */}
      <Dialog open={showAddExistingDialog} onClose={() => setShowAddExistingDialog(false)}>
        <DialogTitle>Vincular grupo propio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Selecciona un grupo propio para agregarlo a TeleStorage
          </DialogContentText>
          <Box sx={{ maxHeight: 300, overflowY: 'auto', mt: 1 }}>
            {allGroups.filter(g => g.isOwner && !g.isAppCreated && !g.isArchived).map(g => (
              <Box key={g.id} onClick={() => setSelectedAddGroup(g)}
                sx={{ p: 1, cursor: 'pointer', borderRadius: 1,
                  bgcolor: selectedAddGroup?.id === g.id ? 'action.selected' : 'transparent', mb: 0.5 }}>
                {g.title}
              </Box>
            ))}
            {allGroups.filter(g => g.isOwner && !g.isAppCreated && !g.isArchived).length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No hay grupos propios sin vincular</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddExistingDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAddExisting} variant="contained" disabled={!selectedAddGroup || addingGroup}>
            {addingGroup ? 'Vinculando...' : 'Vincular'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingGroup} onClose={() => setDeletingGroup(null)}>
        <DialogTitle>Eliminar grupo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de eliminar "{deletingGroup?.title}"? Los archivos no se podrán recuperar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingGroup(null)}>Cancelar</Button>
          <Button onClick={handleDeleteGroup} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar grupo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
```

- [ ] **Step 2: Delete unused CSS module and ConfirmDialog**

```bash
rm "src/pages/GroupListPage.module.css"
rm "src/components/ConfirmDialog.tsx"
rm "src/components/ConfirmDialog.module.css"
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/GroupListPage.tsx
git rm src/pages/GroupListPage.module.css src/components/ConfirmDialog.tsx src/components/ConfirmDialog.module.css
git commit -m "refactor: GroupListPage to MUI Tabs/Dialog, remove ConfirmDialog"
```

---

### Task 6: Migrate SettingsPage + GroupFilesPage + Toolbar

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/GroupFilesPage.tsx`
- Modify: `src/components/Toolbar.tsx`
- Delete: `src/pages/SettingsPage.module.css`
- Delete: `src/pages/GroupFilesPage.module.css`
- Delete: `src/components/Toolbar.module.css`

- [ ] **Step 1: Rewrite SettingsPage with MUI**

Replace `src/pages/SettingsPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FolderIcon from '@mui/icons-material/Folder'
import { useSnackbar } from '../theme/SnackbarContext'

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [downloadPath, setDownloadPath] = useState('')
  const [batchSize, setBatchSize] = useState(50)
  const [defaultTab, setDefaultTab] = useState<'created' | 'active' | 'archived'>('created')
  const [saving, setSaving] = useState(false)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
      setBatchSize(s.batchSize ?? 50)
      setDefaultTab(s.defaultTab ?? 'created')
    })
  }, [])

  const handleSelectFolder = async () => {
    const path = await window.telegramAPI.selectFolder()
    if (path) setDownloadPath(path)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.telegramAPI.setSettings({ downloadPath, batchSize, defaultTab })
      showSnackbar('Configuración guardada', 'success')
    } catch {
      showSnackbar('Error al guardar configuración', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 500 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="body2" fontWeight={600} gutterBottom>Carpeta de descargas</Typography>
          <TextField fullWidth size="small" value={downloadPath} InputProps={{ readOnly: true,
            endAdornment: <Button size="small" onClick={handleSelectFolder} startIcon={<FolderIcon />}>Cambiar</Button>
          }} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={600} gutterBottom>Archivos por carga (batch size)</Typography>
          <TextField type="number" size="small" sx={{ width: 120 }}
            value={batchSize} onChange={e => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))} />
        </Box>
        <Box>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Pestaña por defecto al iniciar</InputLabel>
            <Select value={defaultTab} label="Pestaña por defecto al iniciar"
              onChange={e => setDefaultTab(e.target.value as 'created' | 'active' | 'archived')}>
              <MenuItem value="created">TeleStorage</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="archived">Archivados</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Delete SettingsPage CSS module**

```bash
git rm src/pages/SettingsPage.module.css
```

- [ ] **Step 3: Commit SettingsPage**

```bash
git add src/pages/SettingsPage.tsx
git rm src/pages/SettingsPage.module.css
git commit -m "refactor: SettingsPage to MUI components"
```

- [ ] **Step 4: Rewrite Toolbar with MUI**

Replace `src/components/Toolbar.tsx`:

```tsx
import Box from '@mui/material/Box'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import ViewListIcon from '@mui/icons-material/ViewList'
import GridViewIcon from '@mui/icons-material/GridView'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { ViewMode, FileFilter } from '../types'

interface ToolbarProps {
  viewMode: ViewMode
  filter: FileFilter
  showUpload: boolean
  onViewModeChange: (mode: ViewMode) => void
  onFilterChange: (filter: FileFilter) => void
  onUpload: () => void
}

export default function Toolbar({ viewMode, filter, showUpload, onViewModeChange, onFilterChange, onUpload }: ToolbarProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
      <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, v) => v && onFilterChange(v)}>
        <ToggleButton value="all">Todos</ToggleButton>
        <ToggleButton value="media">Multimedia</ToggleButton>
        <ToggleButton value="documents">Documentos</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ flex: 1 }} />
      <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && onViewModeChange(v)}>
        <ToggleButton value="list"><ViewListIcon /></ToggleButton>
        <ToggleButton value="gallery"><GridViewIcon /></ToggleButton>
      </ToggleButtonGroup>
      {showUpload && (
        <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} onClick={onUpload}>
          + Subir
        </Button>
      )}
    </Box>
  )
}
```

- [ ] **Step 5: Update GroupFilesPage — import Toolbar, use Snackbar, remove inline styles**

Replace `src/pages/GroupFilesPage.tsx` entirely (long file, see spec for full context). Key changes:

1. Import `useSnackbar` from `../theme/SnackbarContext`
2. Replace all `alert()` calls with `showSnackbar()`
3. Replace inline `<div>` headers with MUI `Box`, `Typography`
4. Replace `<CircularProgress>` with MUI import
5. Replace `<ConfirmDialog>` with MUI `<Dialog>`
6. Keep file list/grid/upload/preview logic (those components migrate separately)
7. Add MUI `<Box>` wrappers, remove CSS module classes

- [ ] **Step 6: Delete CSS modules**

```bash
git rm src/components/Toolbar.module.css src/pages/GroupFilesPage.module.css
```

- [ ] **Step 7: Commit**

```bash
git add src/components/Toolbar.tsx src/pages/GroupFilesPage.tsx
git rm src/components/Toolbar.module.css src/pages/GroupFilesPage.module.css
git commit -m "refactor: Toolbar + GroupFilesPage to MUI"
```

---

### Task 7: Migrate FileList + FileListItem

**Files:**
- Modify: `src/components/FileList.tsx`
- Modify: `src/components/FileListItem.tsx`
- Delete: `src/components/FileList.module.css`
- Delete: `src/components/FileListItem.module.css`

- [ ] **Step 1: Rewrite FileListItem with MUI**

Replace `src/components/FileListItem.tsx`:

```tsx
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ImageIcon from '@mui/icons-material/Image'
import MovieIcon from '@mui/icons-material/Movie'
import { TelegramFile } from '../types'
import { formatFileSize, formatDate } from '../utils/format'

interface FileListItemProps {
  file: TelegramFile
  isReadOnly: boolean
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon fontSize="small" />
  if (mimeType.startsWith('video/')) return <MovieIcon fontSize="small" />
  return <InsertDriveFileIcon fontSize="small" />
}

export default function FileListItem({ file, isReadOnly, onDownload, onDelete }: FileListItemProps) {
  return (
    <TableRow hover>
      <TableCell sx={{ width: 36, p: 1 }}>{fileIcon(file.mimeType)}</TableCell>
      <TableCell sx={{ p: 1 }}>
        <Typography variant="body2" noWrap>{file.name}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">{formatFileSize(file.size)}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">{formatDate(file.date)}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <IconButton size="small" onClick={() => onDownload(file)} title="Descargar"><DownloadIcon fontSize="small" /></IconButton>
        {!isReadOnly && (
          <IconButton size="small" onClick={() => onDelete(file)} title="Eliminar"><DeleteIcon fontSize="small" /></IconButton>
        )}
      </TableCell>
    </TableRow>
  )
}
```

- [ ] **Step 2: Rewrite FileList with MUI**

Replace `src/components/FileList.tsx`:

```tsx
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { TelegramFile } from '../types'
import FileListItem from './FileListItem'

interface FileListProps {
  files: TelegramFile[]
  isReadOnly: boolean
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
}

export default function FileList({ files, isReadOnly, onDownload, onDelete }: FileListProps) {
  if (files.length === 0) {
    return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin archivos</Typography>
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 36, p: 1 }} />
          <TableCell sx={{ p: 1 }}>Nombre</TableCell>
          <TableCell sx={{ p: 1 }}>Tamaño</TableCell>
          <TableCell sx={{ p: 1 }}>Fecha</TableCell>
          <TableCell sx={{ p: 1 }}>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files.map(f => (
          <FileListItem key={f.messageId} file={f} isReadOnly={isReadOnly} onDownload={onDownload} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 3: Delete CSS modules**

```bash
git rm src/components/FileList.module.css src/components/FileListItem.module.css
```

- [ ] **Step 4: Commit**

```bash
git add src/components/FileList.tsx src/components/FileListItem.tsx
git rm src/components/FileList.module.css src/components/FileListItem.module.css
git commit -m "refactor: FileList + FileListItem to MUI Table"
```

---

### Task 8: Migrate FileGrid

**Files:**
- Modify: `src/components/FileGrid.tsx`
- Delete: `src/components/FileGrid.module.css`

- [ ] **Step 1: Rewrite FileGrid with MUI**

Replace `src/components/FileGrid.tsx`:

```tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import { TelegramFile } from '../types'

interface FileGridProps {
  files: TelegramFile[]
  onPreview: (file: TelegramFile) => void
}

export default function FileGrid({ files, onPreview }: FileGridProps) {
  if (files.length === 0) {
    return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin archivos multimedia</Typography>
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, p: 1 }}>
      {files.map(f => (
        <GridCard key={f.messageId} file={f} onPreview={onPreview} />
      ))}
    </Box>
  )
}

function gradientForMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  if (mimeType.startsWith('video/')) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
}

function GridCard({ file, onPreview }: { file: TelegramFile; onPreview: (f: TelegramFile) => void }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [thumbnail, setThumbnail] = useState('')

  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          window.telegramAPI.downloadThumbnail(file.groupId, file.messageId).then(url => {
            if (url) setThumbnail(url)
          })
          obs.disconnect()
        }
      })
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [file.groupId, file.messageId])

  return (
    <Box
      ref={imgRef}
      onClick={() => onPreview(file)}
      sx={{
        position: 'relative', aspectRatio: '1', borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
        background: thumbnail ? 'none' : gradientForMime(file.mimeType), backgroundSize: 'cover',
        '&:hover': { opacity: 0.85 },
      }}
    >
      {thumbnail && (
        <Box component="img" src={thumbnail} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {file.mimeType.startsWith('video/') && (
        <IconButton sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
          <PlayCircleIcon fontSize="large" />
        </IconButton>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Delete CSS module**

```bash
git rm src/components/FileGrid.module.css
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FileGrid.tsx
git rm src/components/FileGrid.module.css
git commit -m "refactor: FileGrid to MUI Box grid with intersection observer"
```

---

### Task 9: Migrate PreviewModal

**Files:**
- Modify: `src/components/PreviewModal.tsx`
- Delete: `src/components/PreviewModal.module.css`

- [ ] **Step 1: Rewrite PreviewModal with MUI**

Replace `src/components/PreviewModal.tsx` — full MUI Dialog with navigation, download, progress:

```tsx
import { useState, useEffect, useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import ForwardIcon from '@mui/icons-material/Forward'
import { TelegramFile } from '../types'

interface PreviewModalProps {
  file: TelegramFile | null
  files: TelegramFile[]
  groupId: number
  isReadOnly: boolean
  onClose: () => void
  onDelete: (file: TelegramFile) => void
  onForward: (file: TelegramFile) => void
  onSaveToDisk?: (file: TelegramFile) => void
}

export default function PreviewModal({ file, files, groupId, isReadOnly, onClose, onDelete, onForward, onSaveToDisk }: PreviewModalProps) {
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const cancelledRef = useRef(false)

  const index = file ? files.findIndex(f => f.messageId === file.messageId) : -1
  const prevFile = index > 0 ? files[index - 1] : null
  const nextFile = index < files.length - 1 ? files[index + 1] : null

  useEffect(() => {
    if (!file) return
    setLocalPath('')
    setLoading(true)
    setProgress(0)
    cancelledRef.current = false
    const ext = file.name.split('.').pop() || 'jpg'
    window.telegramAPI.downloadPreview(groupId, file.messageId, ext, (p: number) => {
      if (!cancelledRef.current) setProgress(Math.round(p * 100))
    }).then(path => {
      if (!cancelledRef.current) { setLocalPath(path); setLoading(false) }
    }).catch(() => {
      if (!cancelledRef.current) setLoading(false)
    })
    return () => { cancelledRef.current = true }
  }, [file, groupId])

  const isPreviewable = file?.mimeType.startsWith('image/') || file?.mimeType.startsWith('video/')
  const isVideo = file?.mimeType.startsWith('video/')

  const handlePrev = () => { if (prevFile && onSaveToDisk) onSaveToDisk(prevFile) }
  const handleNext = () => { if (nextFile && onSaveToDisk) onSaveToDisk(nextFile) }

  if (!file) return null

  return (
    <Dialog open fullScreen onClose={onClose}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
        {!isReadOnly && (
          <Tooltip title="Reenviar"><IconButton onClick={() => onForward(file)}><ForwardIcon /></IconButton></Tooltip>
        )}
        {!isReadOnly && (
          <Tooltip title="Eliminar"><IconButton onClick={() => { onClose(); onDelete(file) }}><DeleteIcon /></IconButton></Tooltip>
        )}
        <Tooltip title="Guardar en disco"><IconButton onClick={() => onSaveToDisk?.(file)}><DownloadIcon /></IconButton></Tooltip>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">{file.name}</Typography>
      </Box>
      <DialogContent sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress variant="determinate" value={progress} size={60} />
          </Box>
        )}
        {!loading && localPath && isPreviewable && !isVideo && (
          <Box component="img" src={localPath} sx={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain' }} />
        )}
        {!loading && localPath && isVideo && (
          <Box component="video" src={localPath} controls sx={{ maxWidth: '90%', maxHeight: '80vh' }} />
        )}
        {!loading && !localPath && (
          <Typography color="text.secondary">{file.name}</Typography>
        )}
        {prevFile && (
          <IconButton onClick={handlePrev} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.1)' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
        {nextFile && (
          <IconButton onClick={handleNext} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.1)' }}>
            <ChevronRightIcon />
          </IconButton>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Delete CSS module**

```bash
rm "src/components/PreviewModal.module.css"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PreviewModal.tsx
git rm src/components/PreviewModal.module.css
git commit -m "refactor: PreviewModal to MUI Dialog"
```

---

### Task 10: Migrate UploadDialog

**Files:**
- Modify: `src/components/UploadDialog.tsx`
- Delete: `src/components/UploadDialog.module.css`

- [ ] **Step 1: Rewrite UploadDialog with MUI**

Replace `src/components/UploadDialog.tsx`:

```tsx
import { useState, useRef, DragEvent } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar } from '../theme/SnackbarContext'

interface UploadDialogProps {
  groupId: number
  onClose: () => void
  onUploadComplete: () => void
}

export default function UploadDialog({ groupId, onClose, onUploadComplete }: UploadDialogProps) {
  const [files, setFiles] = useState<{ name: string; path?: string; data?: number[] }[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { showSnackbar } = useSnackbar()

  const handlePick = async () => {
    const paths = await window.telegramAPI.pickFiles()
    if (paths) {
      setFiles(prev => [...prev, ...paths.map(p => ({ name: p.split(/[\\/]/).pop() || p, path: p }))])
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f => {
      if ((f as any).path) return true
      if (f.size > 100 * 1024 * 1024) {
        showSnackbar(`"${f.name}" es demasiado grande para arrastrar (máx. 100 MB)`, 'warning')
        return false
      }
      return true
    })
    Promise.all(dropped.map(f => {
      if ((f as any).path) return { name: f.name, path: (f as any).path }
      return f.arrayBuffer().then(buf => ({ name: f.name, data: Array.from(new Uint8Array(buf)) }))
    })).then(results => setFiles(prev => [...prev, ...results]))
  }

  const handleUpload = async () => {
    if (files.length === 0 || uploading) return
    setUploading(true)
    const errors: string[] = []
    for (const f of files) {
      try {
        if (f.path) {
          await window.telegramAPI.uploadFile(groupId, f.path)
        } else if (f.data) {
          await window.telegramAPI.uploadTempFile(groupId, f.name, f.data)
        }
      } catch {
        errors.push(f.name)
      }
    }
    setUploading(false)
    if (errors.length > 0) {
      showSnackbar(`Errores al subir:\n${errors.join(', ')}`, 'error')
    }
    onUploadComplete()
  }

  return (
    <Dialog open onClose={uploading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{uploading ? 'Subiendo archivos...' : 'Subir archivos'}</DialogTitle>
      <DialogContent>
        <Box
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center', mb: 2, cursor: 'pointer' }}
          onClick={() => inputRef.current?.click()}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">Arrastra archivos aquí o haz clic para seleccionar</Typography>
          <input ref={inputRef} type="file" multiple hidden onChange={handlePick} />
        </Box>
        {files.length > 0 && (
          <List dense>
            {files.map((f, i) => (
              <ListItem key={i} secondaryAction={
                <IconButton edge="end" size="small" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }>
                <Typography variant="body2">{f.name}</Typography>
              </ListItem>
            ))}
          </List>
        )}
        {uploading && <LinearProgress sx={{ mt: 1 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>Cancelar</Button>
        <Button onClick={handleUpload} variant="contained" disabled={files.length === 0 || uploading}>
          {uploading ? 'Subiendo...' : 'Subir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

- [ ] **Step 2: Delete CSS module**

```bash
git rm src/components/UploadDialog.module.css
```

- [ ] **Step 3: Commit**

```bash
git add src/components/UploadDialog.tsx
git rm src/components/UploadDialog.module.css
git commit -m "refactor: UploadDialog to MUI Dialog"
```

---

### Task 11: Migrate fileTypes util (icons)

**Files:**
- Modify: `src/utils/fileTypes.ts`

- [ ] **Step 1: Update fileTypes to return icon component names**

Replace `src/utils/fileTypes.ts`:

```tsx
export function isMedia(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType.startsWith('video/')
}

export function isDocument(mimeType: string): boolean {
  return /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument|application\/vnd\.ms-excel|text\/plain|application\/zip|application\/x-rar|application\/x-7z-compressed)/.test(mimeType)
}

export function fileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
  return 'archive'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/fileTypes.ts
git commit -m "refactor: fileTypes returns icon key instead of emoji"
```

---

### Task 12: Delete CircularProgress component

**Files:**
- Delete: `src/components/CircularProgress.tsx`
- Delete: `src/components/CircularProgress.module.css`

- [ ] **Step 1: Delete files**

```bash
git rm src/components/CircularProgress.tsx src/components/CircularProgress.module.css
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove custom CircularProgress (replaced by MUI)"
```

---

### Task 13: Delete App.css, update main.tsx

**Files:**
- Modify: `src/main.tsx`
- Delete: `src/App.css`

- [ ] **Step 1: Update main.tsx to remove App.css import**

Replace `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Delete App.css**

```bash
git rm src/App.css
```

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git rm src/App.css
git commit -m "chore: remove global App.css (replaced by MUI CssBaseline)"
```

---

### Task 14: Update Tests

**Files:**
- Modify: `tests/unit/pages/SettingsPage.test.tsx`
- Modify: `tests/unit/pages/GroupListPage.test.tsx`
- Modify: `tests/unit/components/GroupListItem.test.tsx`
- Modify: `tests/unit/components/FileListItem.test.tsx`
- Modify: `tests/unit/components/FileList.test.tsx`
- Modify: `tests/unit/components/FileGrid.test.tsx`
- Modify: `tests/unit/components/LoginForm.test.tsx`
- Modify: `tests/unit/components/PreviewModal.test.tsx`
- Modify: `tests/unit/components/UploadDialog.test.tsx`
- Modify: `tests/unit/components/Toolbar.test.tsx`
- Delete: `tests/unit/components/ConfirmDialog.test.tsx`
- Delete: `tests/unit/components/CircularProgress.test.tsx`
- Possibly modify: `tests/unit/pages/LoginPage.test.tsx`

- [ ] **Step 1: Remove ConfirmDialog and CircularProgress tests**

```bash
git rm tests/unit/components/ConfirmDialog.test.tsx tests/unit/components/CircularProgress.test.tsx
git commit -m "chore: remove tests for deleted components (ConfirmDialog, CircularProgress)"
```

- [ ] **Step 2: Update each test file to query MUI components**

Each test needs:
1. Import `ThemeProvider` from `@mui/material/styles` + `createTheme` wrapping
2. Replace element queries for plain `<button>` with MUI `<Button>` / `<IconButton>`
3. Replace queries for CSS-class-based elements with accessible queries (`getByRole`, `getByLabelText`, `getByText`, `getByTestId`)

Example pattern for wrapping:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

// In render calls:
render(<Component />, { wrapper: Wrapper })
```

Example MUI query changes:

```tsx
// Before: fireEvent.click(screen.getByText('Guardar'))
// After: fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

// Before: expect(screen.getByText('Cargando grupos...'))
// After: expect(screen.getByText('Cargando grupos...'))
```

- [ ] **Step 3: Run tests and fix failures**

```bash
npx vitest run 2>&1
```
Expected: all tests pass. Fix any failures due to query changes.

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test: update for MUI components"
```

---

### Task 15: Final verification

- [ ] **Step 1: Run type checking**

```bash
npm run typecheck:web
```
Expected: no type errors.

- [ ] **Step 2: Run full test suite**

```bash
npm test
```
Expected: All 115 tests pass (minus deleted test files).

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: build succeeds without errors.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final fixes after MUI migration"
```
