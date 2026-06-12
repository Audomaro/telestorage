# UI/UX Improvements Design

## Overview

Four batched UX improvement passes for TeleStorage: login overhaul, empty/loading/error states revamp, dialog consistency, and accessibility.

---

## 1. Login Overhaul

### 1a. Country Code Picker
Replace the bare phone `TextField` with a side-by-side layout:
- **Left**: MUI `Autocomplete` with country codes (`+52 México`, `+1 US`, `+34 España`, etc.), width 180px
- **Right**: Phone number `TextField` fills remaining space, `type="tel"`
- Both wrapped in `<Stack direction="row" gap={1}>`

### 1b. Step Navigation
- When on code or 2FA step, show a back arrow icon (`ArrowBackIcon`) above the form
- Clicking back clears the current step: code step → phone input; 2FA step → code input
- User can correct a mistyped phone number without restarting the app

### 1c. Input Validation
- **Phone**: Must contain 7+ digits after country code; show `TextField error` + `helperText`
- **Code**: Must be 4+ characters; show inline error
- **Password**: Must not be empty; show inline error
- Submit button `disabled` until the current field is valid

### 1d. Error Display
- Replace `color="error" Typography` with MUI `<Alert severity="error" onClose={dismiss}>`
- Alert is dismissible, sits above the submit button

### 1e. Files Affected
- `src/components/LoginForm.tsx`, `src/pages/LoginPage.tsx`
- Add country codes data (static array in a new file or inline)

---

## 2. Empty / Loading / Error States

### 2a. Skeleton Loaders
Replace all text-based loading indicators with MUI `Skeleton`:

- **GroupListPage**: 3-4 `Skeleton` variants="rounded" cards matching GroupListItem shape (64px tall, avatar circle + text lines)
- **GroupFilesPage (list mode)**: 5 `Skeleton` table rows matching FileListItem layout
- **GroupFilesPage (gallery mode)**: 6 `Skeleton` square cards (aspect-ratio: 1) in the grid layout
- **SettingsPage**: `Skeleton` height for each section's input area

Logic: when `loading` is true, render skeleton layout instead of real content. Skeletons use `animation="wave"`.

### 2b. Empty States
New `EmptyState` component in `src/components/EmptyState.tsx`:
```
Props: { icon: ReactNode, title: string, subtitle?: string, action?: ReactNode }
```
- Centered flexbox layout, icon in `color="action.disabled"` (64px), title below, optional subtitle, optional action button
- Used in:
  - `GroupListPage` (per tab) — `FolderOffIcon`
  - `FileList` — `InsertDriveFileOutlined`
  - `FileGrid` — `ImageOutlined`
  - `GroupFilesPage` when filter yields no results (future use)

### 2c. Error Display
- Use `<Alert severity="error" onClose={dismiss}>` for all user-facing errors
- Include "Reintentar" button in `action` slot for recoverable errors (file load failure, group load failure)
- Dismiss clears the error state

### 2d. Files Affected
- New: `src/components/EmptyState.tsx`
- Modified: `GroupListPage.tsx`, `GroupFilesPage.tsx`, `FileList.tsx`, `FileGrid.tsx`, `SettingsPage.tsx`

---

## 3. Dialog Consistency

### 3a. Forward Dialog
Replace native `prompt('ID del grupo destino:')` in `GroupFilesPage.handleForward` with an inline MUI Dialog:
- Title: "Reenviar archivo"
- Body: shows file name being forwarded + `TextField` for target group ID (numeric input, `type="number"`)
- Validate: target ID must be a positive number
- Error feedback via `Alert` inside dialog
- Loading state on submit button
- Success → close dialog + show snackbar
- Cancel + Reenviar buttons (MUI Dialog pattern)

### 3b. Vincular Propio Search
Add `TextField` at top of the existing "Vincular grupo propio" dialog:
- `useMemo` filters groups by title match (case-insensitive)
- No search icon needed in the field, just a `placeholder="Buscar grupo..."`

### 3c. Standardization
- All dialogs follow: `DialogTitle` → `DialogContent` (+ `DialogContentText`) → `DialogActions`
- Cancel (left, text/outlined), Confirm (right, contained, `color="error"` for destructive)
- Inputs in dialogs auto-focus via `inputRef` + `setTimeout` to let MUI render first
- Files: `GroupFilesPage.tsx`, `GroupListPage.tsx`

---

## 4. Accessibility

### 4a. IconButton aria-labels
Add `aria-label` to every `IconButton`:

| Component | IconButton | aria-label |
|-----------|-----------|------------|
| AppBar | Back arrow | "Volver" |
| AppBar | Theme toggle | "Cambiar a tema oscuro" / "Cambiar a tema claro" |
| AppBar | Settings | "Configuración" |
| Toolbar | List view | "Vista de lista" |
| Toolbar | Gallery view | "Vista de galería" |
| Toolbar | Upload | "Subir archivos" |
| Toolbar | Select mode | "Seleccionar archivos" |
| Toolbar | Cancel select | "Cancelar selección" |
| Toolbar | Batch delete | "Eliminar seleccionados" |
| FileListItem | Download | "Descargar" |
| FileListItem | Delete | "Eliminar" |
| PreviewModal | Close | "Cerrar vista previa" |
| PreviewModal | Previous | "Anterior" |
| PreviewModal | Next | "Siguiente" |
| PreviewModal | Download | "Guardar en disco" |
| PreviewModal | Forward | "Reenviar" |
| PreviewModal | Delete | "Eliminar" |

### 4b. FileGrid Keyboard Support
- Each grid card: `role="button"`, `tabIndex={0}`, `aria-label={file.name}`
- `onKeyDown`: Enter or Space triggers `onClick`

### 4c. Landmark Regions
- AppBar: MUI AppBar already renders as `<header>` banner landmark
- Main content area: `<Box component="main">` in GroupListPage and GroupFilesPage
- Group list: `<Box component="nav" aria-label="Grupos">` wrapping the group cards

### 4d. Files Affected
- `App.tsx`, `GroupListPage.tsx`, `GroupFilesPage.tsx`, `FileGrid.tsx`, `FileListItem.tsx`, `Toolbar.tsx`, `PreviewModal.tsx`, `GroupListItem.tsx`

---

## Implementation Order

1. Accessibility (aria-labels + keyboard + landmarks — pure additive, no risk)
2. Empty/loading/error states (new components, replace text indicators)
3. Dialog consistency (forward dialog, vincular search)
4. Login overhaul (most invasive — saves best for last after patterns are stable)

## Testing

- Each change is tested via existing test file patterns
- New `EmptyState` component gets its own test file
- Login validation tests updated for country picker + validation logic
- Dialog tests updated for forward dialog (was previously uncovered since `prompt()` wasn't testable)
- Accessibility: no automated tests for aria-labels (manual verification), but component tests should still pass
