# Rename Groups & Forum Topics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to rename owned groups and forum topics via edit icon + dialog. Rename icon only visible on groups where `isOwner === true`, and only in Activos and TeleStorage tabs (not Archivados). Same ownership restriction applies to forum topics.

**Architecture:** Backend GramJS `channels.editTitle` / `channels.editForumTopic` → IPC handlers → preload bridge → React UI with MUI Dialog.

**Tech Stack:** Electron, GramJS (telegram), React, MUI v6, Vitest

---

### File Structure

| File | Change | Responsibility |
|------|--------|---------------|
| `electron/main/telegram/groups.ts` | Add `renameGroup()` + `renameForumTopic()` | GramJS API calls |
| `electron/main/ipc.ts` | Add `groups:rename` + `groups:renameTopic` handlers | IPC bridge |
| `electron/preload/index.ts` | Add `renameGroup` + `renameTopic` bridges | Preload exposure |
| `src/types/electron.d.ts` | Add `renameGroup` + `renameTopic` to `TelegramAPI` | Type declarations |
| `src/components/GroupListItem.tsx` | Add edit IconButton + rename Dialog | Rename group UI |
| `src/components/ForumTopicListItem.tsx` | Add edit IconButton + rename Dialog | Rename topic UI |
| `src/pages/ForumTopicsPage.tsx` | Pass `group.isOwner` to `ForumTopicListItem` | Ownership context |

---

### Task 1: Backend — add `renameGroup` and `renameForumTopic`

**Files:**
- Modify: `electron/main/telegram/groups.ts`

- [ ] **Step 1: Add `renameGroup` and `renameForumTopic` functions**

After `deleteGroup` at line 117, add:

```ts
export async function renameGroup(groupId: number, newTitle: string): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  await client.invoke(
    new (await import('telegram')).Api.channels.EditTitle({
      channel: channelId,
      title: newTitle,
    })
  )
}

export async function renameForumTopic(groupId: number, topicId: number, newTitle: string): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  await client.invoke(
    new (await import('telegram')).Api.channels.EditForumTopic({
      channel: channelId,
      topicId,
      title: newTitle,
    })
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/main/telegram/groups.ts
git commit -m "feat: add renameGroup and renameForumTopic functions"
```

---

### Task 2: IPC handlers — add `groups:rename` and `groups:renameTopic`

**Files:**
- Modify: `electron/main/ipc.ts`

- [ ] **Step 1: Update import of `getForumTopics` to include `renameGroup` + `renameForumTopic`**

```ts
import { getGroups, getArchivedGroups, createGroup, deleteGroup, getForumTopics, renameGroup, renameForumTopic } from './telegram/groups'
```

- [ ] **Step 2: Add IPC handlers after `groups:getTopics` (after line 83)**

```ts
ipcMain.handle('groups:rename', async (_event, groupId: number, title: string) => {
  return renameGroup(groupId, title)
})

ipcMain.handle('groups:renameTopic', async (_event, groupId: number, topicId: number, title: string) => {
  return renameForumTopic(groupId, topicId, title)
})
```

- [ ] **Step 3: Commit**

```bash
git add electron/main/ipc.ts
git commit -m "feat: add groups:rename and groups:renameTopic IPC handlers"
```

---

### Task 3: Preload — add `renameGroup` and `renameTopic` bridges

**Files:**
- Modify: `electron/preload/index.ts`

- [ ] **Step 1: Add bridges after `addToCreatedGroup` (line 15)**

```ts
  renameGroup: (groupId: number, title: string) => ipcRenderer.invoke('groups:rename', groupId, title),
  renameTopic: (groupId: number, topicId: number, title: string) => ipcRenderer.invoke('groups:renameTopic', groupId, topicId, title),
```

- [ ] **Step 2: Commit**

```bash
git add electron/preload/index.ts
git commit -m "feat: add renameGroup and renameTopic preload bridges"
```

---

### Task 4: Types — add `renameGroup` and `renameTopic` to `TelegramAPI`

**Files:**
- Modify: `src/types/electron.d.ts`

- [ ] **Step 1: Add methods to `TelegramAPI` interface (after `addToCreatedGroup`)**

```ts
  renameGroup(groupId: number, title: string): Promise<void>
  renameTopic(groupId: number, topicId: number, title: string): Promise<void>
```

- [ ] **Step 2: Commit**

```bash
git add src/types/electron.d.ts
git commit -m "feat: add renameGroup and renameTopic types"
```

---

### Task 5: GroupListItem — add edit icon + rename dialog (for isOwner, Activos/TeleStorage only)

**Files:**
- Modify: `src/components/GroupListItem.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import EditIcon from '@mui/icons-material/Edit'
```

- [ ] **Step 2: Add `onRename` prop and dialog state**

```tsx
interface GroupListItemProps {
  group: TelegramGroup
  onClick: (group: TelegramGroup) => void
  onDelete?: (group: TelegramGroup) => void
  onRename?: (group: TelegramGroup, newTitle: string) => void
}
```

Add inside the component before the return:
```tsx
const [renameOpen, setRenameOpen] = useState(false)
const [renameTitle, setRenameTitle] = useState(group.title)
```

- [ ] **Step 3: Add rename Dialog before wrapping `</CardContent>` and `</Paper>`**

After the delete IconButton and before `</CardContent>`:
```tsx
        {onRename && group.isOwner && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); setRenameTitle(group.title); setRenameOpen(true) }} aria-label="Renombrar grupo">
            <EditIcon fontSize="small" />
          </IconButton>
        )}
```

After `</CardContent>` and before `</Paper>`, add the Dialog:
```tsx
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Renombrar grupo</DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus value={renameTitle} onChange={e => setRenameTitle(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => { onRename?.(group, renameTitle); setRenameOpen(false) }} sx={{ bgcolor: '#0088cc' }}>Guardar</Button>
        </DialogActions>
      </Dialog>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/GroupListItem.tsx
git commit -m "feat: add rename dialog to GroupListItem"
```

---

### Task 6: ForumTopicListItem — add edit icon + rename dialog

**Files:**
- Modify: `src/components/ForumTopicListItem.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
```

- [ ] **Step 2: Add `onRename` prop, `canRename` prop, and dialog state**

```tsx
interface Props {
  topic: ForumTopic
  onClick: (topic: ForumTopic) => void
  onRename?: (topic: ForumTopic, newTitle: string) => void
  canRename?: boolean
}
```

Add inside the component before return:
```tsx
const [renameOpen, setRenameOpen] = useState(false)
const [renameTitle, setRenameTitle] = useState(topic.title)
```

- [ ] **Step 3: Add edit button and dialog**

After the topic info Box, before `</CardContent>`:
```tsx
        {onRename && canRename && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); setRenameTitle(topic.title); setRenameOpen(true) }} aria-label="Renombrar tema">
            <EditIcon fontSize="small" />
          </IconButton>
        )}
```

After `</CardContent>` and before `</Card>`:
```tsx
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Renombrar tema</DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus value={renameTitle} onChange={e => setRenameTitle(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => { onRename?.(topic, renameTitle); setRenameOpen(false) }} sx={{ bgcolor: '#0088cc' }}>Guardar</Button>
        </DialogActions>
      </Dialog>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ForumTopicListItem.tsx
git commit -m "feat: add rename dialog to ForumTopicListItem"
```

---

### Task 7: ForumTopicsPage — pass rename handler and `canRename` prop

**Files:**
- Modify: `src/pages/ForumTopicsPage.tsx`

- [ ] **Step 1: Add rename handler and pass props to topic list items**

Add import:
```tsx
import { useSnackbar } from '../theme/SnackbarContext'
```

Add after `const [error, setError]`:
```tsx
const { showSnackbar } = useSnackbar()
```

Add rename handler before the return:
```tsx
const handleRename = useCallback(async (topic: ForumTopic, newTitle: string) => {
  try {
    await window.telegramAPI.renameTopic(group.id, topic.id, newTitle)
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, title: newTitle } : t))
    showSnackbar('Tema renombrado correctamente', 'success')
  } catch (err: any) {
    showSnackbar(err.message || 'Error al renombrar tema', 'error')
  }
}, [group.id, showSnackbar])
```

Update the topic rendering:
```tsx
<ForumTopicListItem key={t.id} topic={t} onClick={(topic) => onSelectTopic(topic)} onRename={handleRename} canRename={group.isOwner} />
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ForumTopicsPage.tsx
git commit -m "feat: wire rename handler and canRename prop in ForumTopicsPage"
```

---

### Task 8: GroupListPage — wire rename handler for groups

**Files:**
- Modify: `src/pages/GroupListPage.tsx`

- [ ] **Step 1: Read current file to find where groups are rendered**

(Read the file to locate the group rendering and snackbar context.)

- [ ] **Step 2: Add rename handler**

Add `useSnackbar` import if not already present. Add handler:

```tsx
const handleRename = useCallback(async (group: TelegramGroup, newTitle: string) => {
  try {
    await window.telegramAPI.renameGroup(group.id, newTitle)
    setAllGroups(prev => prev.map(g => g.id === group.id ? { ...g, title: newTitle } : g))
    showSnackbar('Grupo renombrado correctamente', 'success')
  } catch (err: any) {
    showSnackbar(err.message || 'Error al renombrar grupo', 'error')
  }
}, [showSnackbar])
```

- [ ] **Step 3: Pass `onRename` to `GroupListItem` — only when tab is not 'archived'**

Update the group rendering (line 278-280):
```tsx
{visibleGroups.map(g => (
  <GroupListItem key={g.id} group={g} onClick={(grp) => onSelectGroup?.(grp)} onDelete={(grp) => setDeletingGroup(grp)} onRename={tab !== 'archived' ? handleRename : undefined} />
))}
```

The `handleRename` is only passed when tab is not 'archived'. The `GroupListItem` already checks `group.isOwner` internally before showing the edit icon, so no additional prop is needed for the ownership check.

- [ ] **Step 4: Commit**

```bash
git add src/pages/GroupListPage.tsx
git commit -m "feat: wire rename handler for groups in GroupListPage"
```

---

### Task 9: Verify all tests pass

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
Expected: all 129+ tests pass (update any test constructing `GroupListItem` or `ForumTopicListItem` without new optional props)

- [ ] **Step 3: Commit any test fixes**

```bash
git add -A
git commit -m "fix: update tests for rename props"
```
