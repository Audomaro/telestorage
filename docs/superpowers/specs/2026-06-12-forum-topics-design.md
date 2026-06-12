# Forum Topics (Temas) Feature Design — TeleStorage

**Date:** 2026-06-12
**Status:** Approved
**Approach:** B — Two-level navigation (Group → Topics → Files)

---

## 1. Overview

Enable TeleStorage to display and navigate **forum topics** (temas) within Telegram groups. When a group is a forum (has `forum: true`), clicking on it shows a list of topics. Clicking on a topic shows the files within that topic.

This is a Telegram-native feature that groups messages into sub-conversations (topics) within a single group.

---

## 2. Goals

- Detect forum groups and show a "Forum" badge
- Display topics as a navigable list between the group list and file list
- Filter files by topic when viewing a topic's files
- Maintain existing navigation patterns (back button, tabs, etc.)
- Keep changes minimal and consistent with existing architecture

---

## 3. Non-Goals

- Creating new topics from TeleStorage (out of scope for v1)
- Managing topic permissions or settings
- Displaying non-media messages (text-only) from topics
- Real-time topic updates (refresh on navigation)

---

## 4. Data Model

### 4.1 TelegramGroup (extended)

```typescript
interface TelegramGroup {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  isAppCreated?: boolean
  isForum?: boolean        // ← NEW: true if group is a forum
  totalSize?: number
}
```

### 4.2 ForumTopic (new)

```typescript
interface ForumTopic {
  id: number              // Topic ID (top_id in Telegram)
  groupId: number         // Parent group ID
  title: string           // Topic title
  iconColor: number        // Icon color (0-6, Telegram assigns)
  iconEmojiId?: string    // Custom emoji ID (if set)
  totalSize?: number      // File count (optional, for v1)
}
```

---

## 5. API / IPC Changes

### 5.1 New IPC Handlers

| Handler | Description |
|---------|-------------|
| `groups:getTopics` | Fetch topics for a forum group |
| `files:listByTopic` | Fetch files filtered by topic |

### 5.2 GramJS API Usage

**Get Forum Topics:**
```typescript
const result = await client.invoke(
  new Api.channels.GetForumTopics({
    channel: channelId,
    limit: 100,
  })
)
```

**Get Messages by Topic:**
```typescript
// Messages in a topic have replyTo?.topId === topicId
const messages = await client.getMessages(groupId, { limit: 50 })
const topicMessages = messages.filter(m => m.replyTo?.topId === topicId)
```

---

## 6. Navigation Flow

```
GroupListPage
  ├─ Click normal group ──→ GroupFilesPage
  └─ Click forum group ──→ ForumTopicsPage
                              ├─ Click topic ──→ GroupFilesPage (with topicId)
                              └─ Click back ──→ GroupListPage
```

### 6.1 State Management

- `App.tsx` tracks `selectedTopic` alongside `selectedGroup`
- `currentPage` enum: `groupList` | `forumTopics` | `groupFiles` | `settings`
- `handleSelectGroup(group)` checks `group.isForum`:
  - If true → `setCurrentPage('forumTopics')`
  - If false → `setCurrentPage('groupFiles')`

### 6.2 Back Navigation

- From `forumTopics` → back to `groupList`
- From `groupFiles` (with topic) → back to `forumTopics` (not groupList)
- AppBar title: "[Group Name]" when in forumTopics, "[Topic Name]" when in groupFiles with topic

---

## 7. UI Components

### 7.1 ForumTopicsPage

- **Layout:** Same as GroupListPage (list with empty state, loading skeletons)
- **Header:** Group name + "Temas" subtitle
- **List items:** `ForumTopicListItem` components
- **Actions:** Back button in AppBar
- **Empty state:** "No hay temas en este forum"
- **Loading:** Skeleton loaders (same pattern as GroupListPage)

### 7.2 ForumTopicListItem

- **Icon:** Circle with `iconColor` or emoji icon
- **Title:** Topic name
- **Badge:** "Tema" chip
- **Click:** Navigate to GroupFilesPage with topicId
- **Styling:** Same as GroupListItem but smaller/different icon

### 7.3 GroupListItem (extended)

- **Badge addition:** If `isForum: true`, show "Forum" badge alongside "Propio"/"Tercero"
- **No other changes** to existing layout

### 7.4 GroupFilesPage (extended)

- **New prop:** `topicId?: number`
- **File loading:** Calls `files:listByTopic` instead of `files:list` when `topicId` is set
- **Toolbar:** Shows topic name in header or subtitle
- **No other changes** to existing layout

### 7.5 AppBar (extended)

- **Title logic:**
  - `groupList` → "TeleStorage"
  - `forumTopics` → `{group.title}`
  - `groupFiles` (no topic) → `{group.title}`
  - `groupFiles` (with topic) → `{topic.title}`
- **Back button logic:**
  - `groupFiles` with topic → goes back to `forumTopics`
  - `forumTopics` → goes back to `groupList`
  - `groupFiles` without topic → goes back to `groupList` (existing behavior)

---

## 8. Backend Implementation

### 8.1 groups.ts (electron/main/telegram/groups.ts)

```typescript
export interface ForumTopicResult {
  id: number
  groupId: number
  title: string
  iconColor: number
  iconEmojiId?: string
}

export async function getForumTopics(groupId: number): Promise<ForumTopicResult[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')
  
  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))
  
  const result = await client.invoke(
    new Api.channels.GetForumTopics({
      channel: channelId,
      limit: 100,
    })
  )
  
  return (result.topics || []).map((t: any) => ({
    id: Number(t.id),
    groupId,
    title: t.title || 'Sin nombre',
    iconColor: t.iconColor || 0,
    iconEmojiId: t.iconEmojiId?.toString(),
  }))
}
```

### 8.2 files.ts (electron/main/telegram/files.ts)

```typescript
export async function listFilesByTopic(
  groupId: number,
  topicId: number,
  limit: number,
  offsetId?: number,
  search?: string
): Promise<{ files: FileResult[], hasMore: boolean, nextOffsetId?: number }> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')
  
  const messages = await client.getMessages(groupId, { limit, offsetId, search })
  
  // Filter messages that belong to this topic
  const topicMessages = messages.filter(m => m.replyTo?.topId === topicId)
  
  const files = topicMessages.filter(m => m.media).map(m => messageToFileResult(m, groupId))
  const nextOffsetId = topicMessages.length > 0 ? topicMessages[topicMessages.length - 1].id : undefined
  
  return { files, hasMore: topicMessages.length === limit, nextOffsetId }
}
```

### 8.3 IPC Registration

```typescript
// In registerIpcHandlers()
electron.ipcMain.handle('groups:getTopics', async (_event, groupId) => {
  return getForumTopics(groupId)
})

electron.ipcMain.handle('files:listByTopic', async (_event, { groupId, topicId, limit, offsetId, search }) => {
  return listFilesByTopic(groupId, topicId, limit, offsetId, search)
})
```

---

## 9. Renderer Changes

### 9.1 Types (src/types/index.ts)

```typescript
export interface ForumTopic {
  id: number
  groupId: number
  title: string
  iconColor: number
  iconEmojiId?: string
  totalSize?: number
}
```

### 9.2 Electron API (src/types/electron.d.ts)

```typescript
interface Window {
  telegramAPI: {
    // ... existing methods
    getForumTopics: (groupId: number) => Promise<ForumTopic[]>
    listFilesByTopic: (groupId: number, topicId: number, limit: number, offsetId?: number, search?: string) => Promise<{ files: TelegramFile[], hasMore: boolean, nextOffsetId?: number }>
  }
}
```

### 9.3 Preload (electron/preload/index.ts)

```typescript
contextBridge.exposeInMainWorld('telegramAPI', {
  // ... existing methods
  getForumTopics: (groupId: number) => ipcRenderer.invoke('groups:getTopics', groupId),
  listFilesByTopic: (groupId: number, topicId: number, limit: number, offsetId?: number, search?: string) => 
    ipcRenderer.invoke('files:listByTopic', { groupId, topicId, limit, offsetId, search }),
})
```

---

## 10. State & Edge Cases

| Scenario | Behavior |
|----------|----------|
| Forum group with 0 topics | Show empty state "No hay temas en este forum" |
| Topic with 0 files | Show GroupFilesPage empty state "Sin archivos" |
| Non-forum group clicked | Go directly to GroupFilesPage (existing behavior) |
| Back from topic files | Go to ForumTopicsPage (not GroupListPage) |
| Back from forum topics | Go to GroupListPage |
| Error loading topics | Show Alert with retry button |
| Error loading topic files | Show Alert with retry button |
| Topic icon color | Map to MUI color palette (7 colors from Telegram) |

---

## 11. Testing

### 11.1 Unit Tests

- `getForumTopics` returns empty array for non-forum groups
- `getForumTopics` returns topics with correct structure
- `listFilesByTopic` filters messages by `replyTo.topId`
- `dialogToGroupResult` sets `isForum: true` when `entity.forum: true`

### 11.2 E2E Tests

- Forum badge visible on group list item
- Click forum group → ForumTopicsPage
- Topic list shows skeletons while loading
- Topic list shows empty state when no topics
- Click topic → GroupFilesPage
- Back from topic files → ForumTopicsPage
- Back from forum topics → GroupListPage
- Files in topic are correct (only from that topic)

---

## 12. Migration Notes

- No breaking changes to existing data
- `isForum` is optional, existing groups work without it
- New IPC handlers are additive
- Existing `GroupFilesPage` works without `topicId` prop

---

## 13. Open Questions

1. Should we cache topic lists to reduce API calls? (v1: no, fetch on each navigation)
2. Should we show topic file count? (v1: no, requires extra counting)
3. Should we support creating topics from TeleStorage? (v1: no, future feature)

---

## 14. Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `ForumTopic` interface, extend `TelegramGroup` with `isForum` |
| `src/types/electron.d.ts` | Add `getForumTopics` and `listFilesByTopic` to `telegramAPI` |
| `electron/preload/index.ts` | Expose new IPC methods |
| `electron/main/telegram/groups.ts` | Add `getForumTopics`, detect `isForum` in `dialogToGroupResult` |
| `electron/main/telegram/files.ts` | Add `listFilesByTopic` |
| `electron/main/ipc.ts` | Register new IPC handlers |
| `src/App.tsx` | Add `forumTopics` page, handle `isForum` navigation |
| `src/pages/GroupListPage.tsx` | No changes (isForum handled in GroupListItem) |
| `src/pages/ForumTopicsPage.tsx` | NEW: Topic list page |
| `src/components/ForumTopicListItem.tsx` | NEW: Topic item component |
| `src/components/GroupListItem.tsx` | Add Forum badge |
| `src/pages/GroupFilesPage.tsx` | Accept `topicId` prop, use `listFilesByTopic` |
| `src/theme/ColorModeContext.tsx` | No changes |
| `src/utils/fileTypes.ts` | No changes |

---

## 15. Implementation Order

1. **Backend:** Add `getForumTopics` and `listFilesByTopic` in electron/main
2. **IPC:** Register handlers and expose in preload
3. **Types:** Add ForumTopic interface and update TelegramGroup
4. **UI:** Create ForumTopicsPage and ForumTopicListItem
5. **Navigation:** Update App.tsx with forum topics flow
6. **Badge:** Add Forum badge to GroupListItem
7. **File loading:** Update GroupFilesPage to accept topicId
8. **Testing:** Add unit tests and E2E tests
9. **Polish:** Error states, loading states, empty states

---

**Approved by:** User (2026-06-12)
**Next step:** Write implementation plan via `writing-plans` skill
