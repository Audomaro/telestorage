# Groups: App-Created Filter

## Problem
User wants to distinguish groups created via TeleDrive ("+ Nuevo grupo") from all other groups they participate in. Default view should show only app-created groups.

## Design

### 1. Storage — `electron/main/telegram/settings.ts`
- Add `createdGroupIds: number[]` to `AppSettings` (default `[]`)
- Add `addCreatedGroupId(id: number): AppSettings` — appends to array, dedupes, persists

### 2. Group model — `electron/main/telegram/groups.ts`
- Add `isAppCreated: boolean` to `GroupResult`
- `getGroups()` / `getArchivedGroups()`: check each group's ID against `createdGroupIds`
- `createGroup()`: call `addCreatedGroupId()` after successful creation

### 3. Renderer type — `src/types/index.ts`
- Add `isAppCreated?: boolean` to `TelegramGroup`

### 4. Group list UI — `src/pages/GroupListPage.tsx` + CSS
- New state: `appFilter: 'all' | 'created'` (default `'created'`)
- Pill toggle "Todos | Creados por TeleDrive" next to "+ Nuevo grupo" button
- Filter `displayGroups` by `isAppCreated` when `appFilter === 'created'`

### No changes needed
- IPC handlers (no new channels)
- Preload (no new bindings)
- `electron.d.ts`

### Edge cases
- Empty list: show "No hay grupos creados con TeleDrive" when filter is 'created' and list is empty
- Archived groups: same filter applies
- Settings file deleted: `createdGroupIds` defaults to `[]`, showing empty app-created list (all groups still visible via "Todos" filter)
