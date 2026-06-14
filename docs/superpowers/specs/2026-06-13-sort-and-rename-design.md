# Sort Files & Rename Groups/Topics Design

## Overview
Two features: (1) sort files by name/size/date/type in both list and gallery views, (2) rename owned groups and forum topics via edit button + dialog.

---

## Feature 1: Sort Files

### Types
New types in `src/types/index.ts`:
- `SortField = 'name' | 'size' | 'date' | 'type'`
- `SortDirection = 'asc' | 'desc'`

### List Mode
Table headers "Nombre", "Tamaño", "Fecha", "Tipo" are clickable. Clicking a header toggles between asc and desc for that field. Active column shows MUI `TableSortLabel` with ↑/↓ arrow. Only one active sort at a time.

### Gallery Mode
Sort dropdown in the toolbar (to the right of filter buttons). An MUI `Select` showing the active sort property plus a direction toggle button (Asc/Desc).

### State & Logic
- `sortField` and `sortDirection` state in `GroupFilesPage`
- `useMemo` sorts `filteredFiles` after filtering: `[...result].sort((a, b) => ...)` using localeCompare for strings, numeric compare for size, date compare for dates, and mimeType grouping for type
- Same sort state applies to both list and gallery views

---

## Feature 2: Rename Groups & Topics

### Backend
Two new functions in `electron/main/telegram/groups.ts`:
- `renameGroup(groupId, newTitle)` — calls GramJS `channels.editTitle`
- `renameForumTopic(groupId, topicId, newTitle)` — calls GramJS `channels.editForumTopic`

### IPC
- `groups:rename` → `renameGroup(groupId, title)`
- `groups:renameTopic` → `renameTopic(groupId, topicId, title)`

### Preload
- `renameGroup(groupId, title)` → `ipcRenderer.invoke('groups:rename', ...)`
- `renameTopic(groupId, topicId, title)` → `ipcRenderer.invoke('groups:renameTopic', ...)`

### Types
Add `renameGroup` and `renameTopic` to `TelegramAPI` in `src/types/electron.d.ts`

### UI — Groups
- Edit (pencil) IconButton on `GroupListItem` — only visible if `group.isOwner === true`
- Only in TeleStorage and Activos tabs (not Archivados)
- Click opens MUI Dialog with TextField pre-filled with current group name
- Save button → calls `renameGroup` → refreshes group list
- Cancel/Close → closes dialog
- Error snackbar on failure

### UI — Forum Topics
- Edit IconButton on `ForumTopicListItem` — only visible if `group.isOwner === true`
- Same Dialog pattern
- Save → calls `renameTopic` → refreshes topics list

### Ownership check
- `GroupListItem` receives `isOwner` from group data (already available)
- `ForumTopicListItem` receives `isOwner` via props from parent `ForumTopicsPage` (which has the group)
