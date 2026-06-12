# MUI UX/UI Overhaul Design

## Overview

Migrate TeleStorage from CSS Modules to full Material UI (MUI) v6 with a custom theme, light/dark toggle, Material icons replacing all emojis, and Snackbar-based user notifications in Spanish.

## Theme Architecture

### ColorModeContext

React context providing `mode: 'light' | 'dark'` and `toggleColorMode()` to any consumer.

- **Default**: Light
- **Toggle button**: In AppBar header
- **Persistence**: Save preference in `settings.json` as `themeMode` (string) — future enhancement; for MVP use React state only

### MUI Theme (`createTheme`)

| Token | Light | Dark |
|---|---|---|
| `primary` | `#607D8B` (Blue Grey 500) | `#90A4AE` (Blue Grey 300) |
| `secondary` | `#78909C` (Blue Grey 400) | `#B0BEC5` (Blue Grey 200) |
| `background.default` | `#f5f5f5` | `#121212` |
| `background.paper` | `#ffffff` | `#1e1e1e` |
| `text.primary` | `#212121` | `#e0e0e0` |
| `text.secondary` | `#616161` | `#9e9e9e` |
| `divider` | `#e0e0e0` | `#333333` |
| `error` | `#e53935` | `#ef5350` |
| `warning` | `#FF9800` | `#FFA726` |
| `success` | `#4CAF50` | `#66BB6A` |
| `info` | `#2196F3` | `#42A5F5` |

- **Typography**: `Roboto` (MUI default), 14px default body
- **Shape**: `borderRadius: 8` for components
- **CssBaseline**: Global reset (replaces `App.css` reset + box-sizing)

## Component Migration

### Removed files (CSS Modules deleted)

All `.module.css` files are removed. Styling moves to MUI `sx` prop or `styled()`.

### LoginForm

| Current | MUI |
|---|---|
| Plain `<input>` | `<TextField fullWidth variant="outlined">` |
| Plain `<button>` | `<Button variant="contained" fullWidth>` |
| Title `<h1>` | `<Typography variant="h5">` |
| Emoji/brand | `<Storage>` icon (Material) |
| Loading text | `<CircularProgress size={24}>` inside Button |

**Props**: Keeps `onLogin`, `phone`, `step`, `error`, `loading` — same API.

### GroupListPage

| Current | MUI |
|---|---|
| 3 `<button>` tabs | `<Tabs>` + `<Tab>` |
| Header `<div>` | `<AppBar>` (already in App.tsx parent) |
| Group `<div>` items | `<Card>` or `<ListItem>` with `<Avatar>` |
| `ConfirmDialog` custom | `<Dialog>` MUI |
| Create group `<div>` overlay | `<Dialog>` MUI |
| Link group `<div>` overlay | `<Dialog>` MUI |
| Error `<div>` | `<Alert severity="error">` in `<Snackbar>` |

**Tab state**: Keeps `localStorage` + `_sessionFirstMount` logic + `defaultTab` setting.

**Filters**: `allGroups` → `allGroups.filter(...)` same logic. No UI changes to filtering.

### GroupListItem

| Current | MUI |
|---|---|
| Colored circle avatar | `<Avatar sx={{ bgcolor: ... }}>` with initials |
| Badge "Propio" / "Tercero" | `<Chip label="Propio" color="primary" size="small">` |
| Read-only badge | `<Chip label="Solo lectura" variant="outlined">` |
| Archived badge | `<Chip label="Archivado" variant="outlined">` |
| Delete button | `<IconButton>` with `<DeleteIcon>` |

**Emoji → Icon mapping**:
- `🗑️` → `<DeleteIcon />`
- Owner badge → `<CheckCircleIcon />` as Chip icon
- Third-party badge → `<GroupIcon />` as Chip icon

### GroupFilesPage

| Current | MUI |
|---|---|
| Header | Shared `AppBar` from App.tsx |
| `Toolbar` component | `<ToggleButtonGroup>` + `<Button variant="contained">` |
| Upload button | `<Button startIcon={<UploadIcon/>}>+ Subir` |
| Loading | `<Skeleton variant="rectangular">` |
| Empty state | `<Typography color="text.secondary">` + `<Icon>` |
| Error state | `<Alert>` in `<Snackbar>` |

### FileList (list view)

| Current | MUI |
|---|---|
| `<div>` rows | `<Table>` + `<TableBody>` with `<TableRow>` |
| File icon | `<InsertDriveFileIcon>` / `<ImageIcon>` / `<MovieIcon>` |
| Download button | `<IconButton>` with `<DownloadIcon>` |
| Delete button | `<IconButton>` with `<DeleteIcon>` |
| Size/date text | `<Typography variant="body2">` |
| Empty | `<TableRow>` with colspan message |

### FileGrid (gallery)

| Current | MUI |
|---|---|
| CSS Grid manual | `<ImageList variant="masonry">` or `"woven"` |
| Thumbnail div | `<ImageListItem>` |
| Play button overlay | `<IconButton sx={{ position: 'absolute' }}>` with `<PlayCircleIcon>` |
| Empty | `<Typography>` centered |

### PreviewModal

| Current | MUI |
|---|---|
| `<div>` overlay | `<Dialog fullScreen>` or `<Dialog maxWidth="xl">` |
| Close button | `<IconButton onClick={onClose}>` `<CloseIcon>` |
| Download | `<IconButton>` `<DownloadIcon>` |
| Delete | `<IconButton>` `<DeleteIcon>` |
| Forward | `<IconButton>` `<ForwardIcon>` |
| Nav arrows | `<IconButton>` `<ChevronLeftIcon>` / `<ChevronRightIcon>` |
| Progress | `<CircularProgress variant="determinate">` |
| Loading overlay | `<Backdrop>` + `<CircularProgress>` |

### UploadDialog

| Current | MUI |
|---|---|
| `<div>` overlay | `<Dialog>` |
| Drop zone | `<Box sx={{ border: '2px dashed ...' }}>` |
| File list | `<List>` + `<ListItem>` |
| Remove file | `<IconButton>` `<CloseIcon>` |
| Upload button | `<Button variant="contained" startIcon={<UploadIcon/>}>` |
| Drag hint | `<CloudUploadIcon>` + `<Typography>` |
| Progress | `<LinearProgress>` |

### ConfirmDialog

Replaced entirely by MUI `<Dialog>` — this component is deleted.

```tsx
<Dialog open={!!deletingGroup} onClose={() => setDeletingGroup(null)}>
  <DialogTitle>Eliminar grupo</DialogTitle>
  <DialogContent>
    <DialogContentText>
      ¿Estás seguro de eliminar "{group.title}"? Los archivos no se podrán recuperar.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeletingGroup(null)}>Cancelar</Button>
    <Button onClick={handleDeleteGroup} color="error" variant="contained" disabled={deleting}>
      {deleting ? 'Eliminando...' : 'Eliminar'}
    </Button>
  </DialogActions>
</Dialog>
```

### SettingsPage

| Current | MUI |
|---|---|
| Folder path input | `<TextField variant="outlined" InputProps={{ readOnly: true, endAdornment: <Button>... }}>` |
| Batch size | `<TextField type="number">` |
| Default tab select | `<Select>` + `<MenuItem>` |
| Save button | `<Button variant="contained" color="primary">` |
| Saved message | `<Snackbar>` + `<Alert severity="success">` |
| Header | Shared `AppBar` |

## Icons: Emoji → Material Icons

All emojis replaced by `@mui/icons-material`:

| Emoji | MUI Icon | Component |
|---|---|---|
| `⚙️` | `<SettingsIcon>` | AppBar, Settings button |
| `⬅️` | `<ArrowBackIcon>` | Back navigation |
| `🗑️` | `<DeleteIcon>` | Delete buttons |
| `⬇️` | `<DownloadIcon>` | Download buttons |
| `📋` | `<ViewListIcon>` | List view toggle |
| `🖼️` | `<GridViewIcon>` o `<PhotoLibraryIcon>` | Gallery view toggle |
| `🎬` | `<MovieIcon>` | Video file type |
| `📁` | `<FolderOpenIcon>` o `<CloudUploadIcon>` | Upload dialog |
| `✕` | `<CloseIcon>` | Close, remove |
| `‹` / `›` | `<ChevronLeftIcon>` / `<ChevronRightIcon>` | Preview navigation |
| `▶️` | `<PlayCircleIcon>` | Video play badge |
| `↗️` | `<ForwardIcon>` | Forward/share |
| `📄` | `<DescriptionIcon>` o `<InsertDriveFileIcon>` | Document file type |
| `📦` | `<ArchiveIcon>` | Unknown/archive file type |
| `✅`/checkmark | `<CheckCircleIcon>` | Success notifications |
| `⚠️` | `<WarningIcon>` | Warning notifications |
| `❌` | `<ErrorIcon>` | Error notifications |
| `☀️` / `🌙` | `<Brightness7Icon>` / `<Brightness4Icon>` | Theme toggle |

**File type helper** (`src/utils/fileTypes.ts`):
- Returns MUI icon component name instead of emoji string. Caller renders `<Icon />`.

## User Notifications (Snackbar)

All `alert()` calls replaced by `<Snackbar>` + `<Alert>`:

```tsx
// Usage pattern
const [snackbar, setSnackbar] = useState<{
  open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning'
}>({ open: false, message: '', severity: 'info' })

const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  setSnackbar({ open: true, message, severity })
}

// Component at page level
<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
  <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
    {snackbar.message}
  </Alert>
</Snackbar>
```

All error messages (`Error al cargar grupos`, `Error al eliminar`, etc.), success messages (`Archivo reenviado`, `✓ Configuración guardada`), and info messages go through Snackbar.

## App Layout

```
<ThemeProvider theme={theme}>
  <CssBaseline />
  <ColorModeContext.Provider>
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
        {/* Page content */}
      </Box>
    </Box>
    {/* Snackbar for notifications */}
  </ColorModeContext.Provider>
</ThemeProvider>
```

- `showBack` is determined by which page is shown: true for Settings, GroupFiles, Login; false for GroupList
- **Snackbar lives at App level** so it works across all pages
- Each page provides a `showSnackbar` prop or hook, or we use a global context for snackbar

## Dependencies Added

```json
{
  "@mui/material": "^6.0.0",
  "@mui/icons-material": "^6.0.0",
  "@emotion/react": "^11.0.0",
  "@emotion/styled": "^11.0.0"
}
```

## Files to Delete

- All `.module.css` files (18 files)
- `src/components/ConfirmDialog.tsx` + `.module.css`
- `src/components/CircularProgress.tsx` + `.module.css` (replaced by MUI `<CircularProgress>`)
- `src/App.css` (replaced by `CssBaseline`)

## Files to Modify

- `src/App.tsx` — ThemeProvider, ColorModeContext, AppBar, Snackbar
- `src/main.tsx` — (possibly unchanged)
- `src/pages/LoginPage.tsx` — MUI components
- `src/components/LoginForm.tsx` — MUI components
- `src/pages/GroupListPage.tsx` — MUI components, Snackbar, remove ConfirmDialog
- `src/components/GroupListItem.tsx` — MUI Card/Avatar/Chip/IconButton
- `src/pages/GroupFilesPage.tsx` — MUI components, Snackbar
- `src/components/Toolbar.tsx` — `<ToggleButtonGroup>`, `<Button>`, icons
- `src/components/FileList.tsx` — `<Table>`, `<TableBody>`
- `src/components/FileListItem.tsx` — MUI TableRow, icons
- `src/components/FileGrid.tsx` — `<ImageList>`, `<ImageListItem>`
- `src/components/PreviewModal.tsx` — `<Dialog>`, icons, MUI Progress
- `src/components/UploadDialog.tsx` — `<Dialog>`, `<Box>`, upload icon
- `src/pages/SettingsPage.tsx` — MUI components, Snackbar
- `src/utils/fileTypes.ts` — Return icon component names instead of emoji strings
- `electron/main/telegram/settings.ts` — Add `themeMode` to `AppSettings` (future)
- `src/types/electron.d.ts` — Add `themeMode` to `AppSettings` (future)

## Snackbar Architecture

Create a shared `SnackbarContext` at App level:

```tsx
interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void
}
```

All pages consume via `useContext(SnackbarContext)` or a custom hook `useSnackbar()`.

This replaces all `alert()` calls and inline error state rendering (red boxes).

## Test Strategy

- Update imports: replace `@testing-library/react` queries on CSS class selectors with MUI component queries
- `ConfirmDialog` tests → test MUI `<Dialog>` directly or remove (logic tested via parent components)
- `CircularProgress` tests → remove (MUI component already tested by library)
- `GroupListItem` tests → update for MUI `<Avatar>`, `<Chip>`, `<IconButton>`
- `SettingsPage` tests → update for MUI `<TextField>`, `<Select>`
- External behavior (what users see and interact with) stays the same; only styling changes

## Implementation Plan

1. Install MUI dependencies (`npm install @mui/material @mui/icons-material @emotion/react @emotion/styled`)
2. Create theme + ColorModeContext (new files in `src/theme/`)
3. Rewrite `App.tsx` with ThemeProvider, AppBar, SnackbarContext
4. Migrate LoginForm (first page, isolated)
5. Migrate GroupListPage + GroupListItem + dialogs
6. Migrate SettingsPage
7. Migrate GroupFilesPage + Toolbar
8. Migrate FileList + FileListItem
9. Migrate FileGrid
10. Migrate PreviewModal
11. Migrate UploadDialog
12. Delete unused files (CSS Modules, ConfirmDialog, CircularProgress)
13. Update tests
14. Verify build + all tests pass
