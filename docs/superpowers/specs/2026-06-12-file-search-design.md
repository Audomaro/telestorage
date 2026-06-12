# File Search by Name/Extension

**Date:** 2026-06-12
**Status:** Draft

## Overview

Add a search TextField to the Toolbar that lets users filter files by name or extension using Telegram's server-side `messages.search` API. Search works in both list and gallery modes, alongside existing type filters (Todos/Media/Documentos).

## Data Flow

1. User types a query in the search field
2. 300ms debounce before triggering the search
3. Current file list resets, loads first batch with `search` parameter
4. Backend passes `search` to `client.getMessages(groupId, { limit, offsetId, search })`
5. Telegram server returns only messages whose text, filename, or caption matches the query
6. Client-side filters (Todos/Media/Documentos) apply on top of server results
7. Clearing the search field → reloads without search parameter (full list)
8. Infinite scroll continues with the same search query for subsequent batches

## Architecture

### Backend changes

**`electron/main/telegram/files.ts` — `listFilesBatch()`**
```ts
export async function listFilesBatch(
  groupId: number, limit: number, offsetId?: number, search?: string
): Promise<ListFilesBatchResult> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { limit, offsetId, search })
  // ... rest unchanged
}
```

**`electron/main/ipc.ts`**
- Forward `search` from IPC invoke args to `listFilesBatch()`

**`electron/preload/index.ts`**
- Update `loadMoreFiles` to accept and forward `search` parameter

### Frontend changes

**`src/types/electron.d.ts`**
```ts
loadMoreFiles(groupId: number, offsetId?: number, search?: string): Promise<...>
```

**`src/components/Toolbar.tsx`**
- Add search `TextField` with `InputAdornment` (Search icon)
- Position: between filter/view toggle group and upload/select buttons
- Debounced onChange (300ms) calls `onSearchChange(query)`
- Visible in both list and gallery modes
- `size="small"`, `placeholder="Buscar archivos..."`

New props:
```ts
searchQuery: string
onSearchChange: (query: string) => void
```

**`src/pages/GroupFilesPage.tsx`**
- Add `searchQuery` state (string)
- Debounce effect: when `searchQuery` changes, reset files and call `loadInitialFiles(searchQuery)`
- Modify `loadInitialFiles` to accept optional search param
- Modify `handleLoadMore` to include current `searchQuery` in API call
- Pass `searchQuery` and `onSearchChange` to Toolbar

### Debounce logic

```ts
useEffect(() => {
  const timer = setTimeout(() => {
    loadInitialFiles(searchQuery)
  }, 300)
  return () => clearTimeout(timer)
}, [searchQuery])
```

## Interaction with existing filters

- **Search + type filter**: Both apply. Search narrows by text/name (server-side), then type filter further narrows (client-side)
- **Search + gallery mode**: In gallery mode, search filters media files by name. The current `viewMode === 'gallery'` filter (`isMedia && !isExcludedFromMedia`) still applies after search results
- **Search + pagination**: Search query is passed to every `loadMoreFiles` call so Telegram continues returning matching results

## Error handling

- API errors during search show the existing Alert with Retry button (unchanged)
- Search failing doesn't break normal browsing — error message is the same "Error al cargar archivos"

## Testing

- No existing GroupFilesPage test file, so no test updates needed
- If Toolbar tests exist, add test for search TextField render and onChange
- Backend: No unit tests for IPC/files currently — search is a trivial param passthrough

## Files changed

| File | Change |
|------|--------|
| `electron/main/telegram/files.ts` | Add `search` param to `listFilesBatch` |
| `electron/main/ipc.ts` | Forward `search` from IPC args |
| `electron/preload/index.ts` | Forward `search` in `loadMoreFiles` |
| `src/types/electron.d.ts` | Update `loadMoreFiles` signature |
| `src/components/Toolbar.tsx` | Add search TextField + debounce |
| `src/pages/GroupFilesPage.tsx` | Add searchQuery state, pass to Toolbar + API |
