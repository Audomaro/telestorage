# Forum Topics (Temas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add forum topics navigation to TeleStorage — when a Telegram group is a forum, show its topics as a list before showing files.

**Architecture:** Two-level navigation: GroupList → ForumTopicsPage (for forums) → GroupFilesPage (with topicId filter). Backend uses GramJS `Api.channels.GetForumTopics` and filters messages by `replyTo.topId`.

**Tech Stack:** React, MUI, TypeScript, Electron IPC, GramJS

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | Add `ForumTopic` interface, extend `TelegramGroup` with `isForum` |
| `src/types/electron.d.ts` | Add `getForumTopics` and `listFilesByTopic` to `telegramAPI` type |
| `electron/preload/index.ts` | Expose new IPC methods to renderer |
| `electron/main/telegram/groups.ts` | Add `getForumTopics` function, detect `isForum` in `dialogToGroupResult` |
| `electron/main/telegram/files.ts` | Add `listFilesByTopic` function |
| `electron/main/ipc.ts` | Register `groups:getTopics` and `files:listByTopic` handlers |
| `src/App.tsx` | Add `forumTopics` page state, handle `isForum` navigation, back button logic |
| `src/pages/ForumTopicsPage.tsx` | NEW: List topics for a forum group |
| `src/components/ForumTopicListItem.tsx` | NEW: Topic card with icon, title, badge |
| `src/components/GroupListItem.tsx` | Add "Forum" badge when `isForum: true` |
| `src/pages/GroupFilesPage.tsx` | Accept `topicId` prop, use `listFilesByTopic` when set |

---

## Task 1: Add Types and Backend Functions

**Files:**
- Modify: `src/types/index.ts`
- Modify: `electron/main/telegram/groups.ts`
- Modify: `electron/main/telegram/files.ts`

- [ ] **Step 1: Add ForumTopic interface to types**

```typescript
// src/types/index.ts
export interface ForumTopic {
  id: number
  groupId: number
  title: string
  iconColor: number
  iconEmojiId?: string
  totalSize?: number
}
```

- [ ] **Step 2: Extend TelegramGroup with isForum**

```typescript
// src/types/index.ts
export interface TelegramGroup {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  isAppCreated?: boolean
  isForum?: boolean        // ← NEW
  totalSize?: number
}
```

- [ ] **Step 3: Add getForumTopics to groups.ts**

```typescript
// electron/main/telegram/groups.ts
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
    new (await import('telegram')).Api.channels.GetForumTopics({
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

- [ ] **Step 4: Detect isForum in dialogToGroupResult**

```typescript
// electron/main/telegram/groups.ts
function dialogToGroupResult(d: any, createdIds: number[]): GroupResult {
  const isArchived = (d as any).folderId === 1
  return {
    id: Number(d.id),
    title: d.title || 'Unnamed',
    isArchived,
    isOwner: d.entity && 'creator' in d.entity ? Boolean((d.entity as any).creator) : false,
    totalSize: 0,
    isAppCreated: isGroupAppCreated(Number(d.id), createdIds),
    isForum: (d as any).entity?.forum || false,  // ← NEW
  }
}
```

- [ ] **Step 5: Add listFilesByTopic to files.ts**

```typescript
// electron/main/telegram/files.ts
export async function listFilesByTopic(
  groupId: number,
  topicId: number,
  limit: number,
  offsetId?: number,
  search?: string
): Promise<ListFilesBatchResult> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { limit, offsetId, search })
  const topicMessages = messages.filter(m => m.replyTo?.topId === topicId)

  const files = topicMessages.filter(m => m.media).map(m => messageToFileResult(m, groupId))
  const nextOffsetId = topicMessages.length > 0 ? topicMessages[topicMessages.length - 1].id : undefined

  return { files, hasMore: topicMessages.length === limit, nextOffsetId }
}
```

- [ ] **Step 6: Run tests to verify no regressions**

Run: `npm run test`
Expected: All existing tests pass (no tests for new functions yet)

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts electron/main/telegram/groups.ts electron/main/telegram/files.ts
git commit -m "feat: add forum topics backend - getForumTopics and listFilesByTopic"
```

---

## Task 2: Register IPC and Preload

**Files:**
- Modify: `electron/main/ipc.ts`
- Modify: `electron/preload/index.ts`
- Modify: `src/types/electron.d.ts`

- [ ] **Step 1: Import new functions in ipc.ts**

```typescript
// electron/main/ipc.ts
import { getForumTopics } from './telegram/groups'
import { listFilesByTopic } from './telegram/files'
```

- [ ] **Step 2: Register IPC handlers**

Add after the existing groups handlers:
```typescript
// electron/main/ipc.ts
ipcMain.handle('groups:getTopics', async (_event, groupId: number) => {
  return getForumTopics(groupId)
})
```

Add after the existing files handlers:
```typescript
// electron/main/ipc.ts
ipcMain.handle('files:listByTopic', async (_event, { groupId, topicId, limit, offsetId, search }: { groupId: number; topicId: number; limit: number; offsetId?: number; search?: string }) => {
  return listFilesByTopic(groupId, topicId, limit, offsetId, search)
})
```

- [ ] **Step 3: Expose in preload**

```typescript
// electron/preload/index.ts
getForumTopics: (groupId: number) => ipcRenderer.invoke('groups:getTopics', groupId),
listFilesByTopic: (groupId: number, topicId: number, limit: number, offsetId?: number, search?: string) =>
  ipcRenderer.invoke('files:listByTopic', { groupId, topicId, limit, offsetId, search }),
```

- [ ] **Step 4: Update electron.d.ts**

```typescript
// src/types/electron.d.ts
interface Window {
  telegramAPI: {
    // ... existing methods
    getForumTopics: (groupId: number) => Promise<ForumTopic[]>
    listFilesByTopic: (groupId: number, topicId: number, limit: number, offsetId?: number, search?: string) => Promise<{ files: TelegramFile[], hasMore: boolean, nextOffsetId?: number }>
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add electron/main/ipc.ts electron/preload/index.ts src/types/electron.d.ts
git commit -m "feat: register forum topics IPC handlers and expose in preload"
```

---

## Task 3: Create ForumTopicListItem Component

**Files:**
- Create: `src/components/ForumTopicListItem.tsx`

- [ ] **Step 1: Create ForumTopicListItem component**

```typescript
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { ForumTopic } from '../types'

interface ForumTopicListItemProps {
  topic: ForumTopic
  onClick: (topic: ForumTopic) => void
}

// Telegram forum topic colors mapped to MUI colors
const TOPIC_COLORS: Record<number, string> = {
  0: '#E17076', // Red
  1: '#FAA774', // Orange
  2: '#FECD6E', // Yellow
  3: '#A8D480', // Green
  4: '#77C5E3', // Light Blue
  5: '#5FA3E1', // Blue
  6: '#A28FEF', // Purple
}

export default function ForumTopicListItem({ topic, onClick }: ForumTopicListItemProps) {
  return (
    <Card
      sx={{ mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      onClick={() => onClick(topic)}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: TOPIC_COLORS[topic.iconColor] || TOPIC_COLORS[0],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {topic.title.charAt(0).toUpperCase()}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap>{topic.title}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip label="Tema" color="info" size="small" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ForumTopicListItem.tsx
git commit -m "feat: create ForumTopicListItem component with topic colors"
```

---

## Task 4: Create ForumTopicsPage

**Files:**
- Create: `src/pages/ForumTopicsPage.tsx`

- [ ] **Step 1: Create ForumTopicsPage component**

```typescript
import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import { TelegramGroup, ForumTopic } from '../types'
import ForumTopicListItem from '../components/ForumTopicListItem'
import EmptyState from '../components/EmptyState'

interface ForumTopicsPageProps {
  group: TelegramGroup
  onSelectTopic: (topic: ForumTopic) => void
  onBack: () => void
}

export default function ForumTopicsPage({ group, onSelectTopic, onBack }: ForumTopicsPageProps) {
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTopics()
  }, [group.id])

  const loadTopics = async () => {
    setLoading(true)
    setError('')
    try {
      const t = await window.telegramAPI.getForumTopics(group.id)
      setTopics(t)
    } catch (err: any) {
      setError(err.message || 'Error al cargar temas')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <Box component="main">
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {group.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Temas del forum
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mt: 1 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ px: 2 }}>
        {topics.map(t => (
          <ForumTopicListItem key={t.id} topic={t} onClick={onSelectTopic} />
        ))}
        {topics.length === 0 && (
          <EmptyState icon={<FolderOffIcon />} title="No hay temas en este forum" />
        )}
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ForumTopicsPage.tsx
git commit -m "feat: create ForumTopicsPage with loading, error, and empty states"
```

---

## Task 5: Update App.tsx with Forum Navigation

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import ForumTopicsPage**

```typescript
import ForumTopicsPage from './pages/ForumTopicsPage'
import { ForumTopic } from './types'
```

- [ ] **Step 2: Add state for forum topics**

```typescript
const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null)
```

- [ ] **Step 3: Update handleBack for forum navigation**

```typescript
const handleBack = () => {
  if (showSettings) setShowSettings(false)
  else if (selectedTopic) setSelectedTopic(null)
  else if (selectedGroup) setSelectedGroup(null)
}
```

- [ ] **Step 4: Update showBack logic**

```typescript
const showBack = showSettings || !!selectedTopic || !!selectedGroup
```

- [ ] **Step 5: Update handleSelectGroup to check isForum**

```typescript
const handleSelectGroup = (group: TelegramGroup) => {
  if (group.isForum) {
    setSelectedGroup(group)
    setSelectedTopic(null)
  } else {
    setSelectedGroup(group)
    setSelectedTopic(null)
  }
}
```

Actually, simpler: always set the group, and the render logic handles whether to show ForumTopicsPage or GroupFilesPage.

```typescript
const handleSelectGroup = (group: TelegramGroup) => {
  setSelectedGroup(group)
  setSelectedTopic(null)
}
```

- [ ] **Step 6: Update handleLogout to clear topic**

```typescript
const handleLogout = async () => {
  setConfirmLogout(false)
  await window.telegramAPI.logout()
  setIsLoggedIn(false)
  setSelectedGroup(null)
  setSelectedTopic(null)
  setShowSettings(false)
  setShowDownloads(false)
}
```

- [ ] **Step 7: Update AppBar title logic**

```typescript
<Typography variant="h6" sx={{ flexGrow: 0, mr: 2 }} noWrap>
  {selectedTopic ? selectedTopic.title : selectedGroup ? selectedGroup.title : 'TeleStorage'}
</Typography>
```

- [ ] **Step 8: Update render logic for forum topics**

```typescript
{!isLoggedIn
  ? <LoginPage onLogin={() => setIsLoggedIn(true)} />
  : showSettings
    ? <SettingsPage onBack={() => setShowSettings(false)} />
    : selectedGroup?.isForum && !selectedTopic
      ? <ForumTopicsPage
          group={selectedGroup}
          onSelectTopic={setSelectedTopic}
          onBack={() => setSelectedGroup(null)}
        />
      : selectedGroup
        ? <GroupFilesPage
            group={selectedGroup}
            topic={selectedTopic || undefined}
            onBack={() => selectedTopic ? setSelectedTopic(null) : setSelectedGroup(null)}
            onSettings={() => setShowSettings(true)}
          />
        : <GroupListPage onSelectGroup={handleSelectGroup} onSettings={() => setShowSettings(true)} />
}
```

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add forum topics navigation flow in App.tsx"
```

---

## Task 6: Update GroupFilesPage to Accept Topic

**Files:**
- Modify: `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Update interface to accept topic**

```typescript
interface GroupFilesPageProps {
  group: TelegramGroup
  topic?: ForumTopic
  onBack: () => void
  onSettings?: () => void
}
```

- [ ] **Step 2: Update load function to use topic**

```typescript
export default function GroupFilesPage({ group, topic, onBack, onSettings }: GroupFilesPageProps) {
  // ... existing state

  const loadFiles = async (searchQuery?: string) => {
    setLoading(true)
    setError(null)
    try {
      if (topic) {
        const result = await window.telegramAPI.listFilesByTopic(group.id, topic.id, 50, undefined, searchQuery)
        setAllFiles(result.files)
        setHasMore(result.hasMore)
        offsetRef.current = result.nextOffsetId
      } else {
        const result = await window.telegramAPI.loadMoreFiles(group.id, undefined, searchQuery)
        setAllFiles(result.files)
        setHasMore(result.hasMore)
        offsetRef.current = result.nextOffsetId
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }
```

- [ ] **Step 3: Update loadMoreFiles to use topic**

```typescript
const loadMoreFiles = async (searchQuery?: string) => {
  if (loadingMoreRef.current || !hasMoreRef.current) return
  loadingMoreRef.current = true
  setLoadingMore(true)
  try {
    if (topic) {
      const result = await window.telegramAPI.listFilesByTopic(group.id, topic.id, 50, offsetRef.current, searchQuery)
      setAllFiles(prev => [...prev, ...result.files])
      setHasMore(result.hasMore)
      hasMoreRef.current = result.hasMore
      offsetRef.current = result.nextOffsetId
    } else {
      const result = await window.telegramAPI.loadMoreFiles(group.id, offsetRef.current, searchQuery)
      setAllFiles(prev => [...prev, ...result.files])
      setHasMore(result.hasMore)
      hasMoreRef.current = result.hasMore
      offsetRef.current = result.nextOffsetId
    }
  } catch (err: any) {
    setError(err.message || 'Error al cargar más archivos')
  } finally {
    setLoadingMore(false)
    loadingMoreRef.current = false
  }
}
```

- [ ] **Step 4: Import ForumTopic type**

```typescript
import { TelegramGroup, TelegramFile, ViewMode, FileFilter, ForumTopic } from '../types'
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/GroupFilesPage.tsx
git commit -m "feat: update GroupFilesPage to support topic filtering"
```

---

## Task 7: Add Forum Badge to GroupListItem

**Files:**
- Modify: `src/components/GroupListItem.tsx`

- [ ] **Step 1: Add Forum badge**

```typescript
{group.isForum && (
  <Chip label="Forum" variant="outlined" size="small" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }} />
)}
```

Add this after the existing chips in the flex container.

- [ ] **Step 2: Commit**

```bash
git add src/components/GroupListItem.tsx
git commit -m "feat: add Forum badge to GroupListItem"
```

---

## Task 8: Add Tests

**Files:**
- Create: `src/__tests__/ForumTopicListItem.test.tsx`
- Create: `src/__tests__/ForumTopicsPage.test.tsx`

- [ ] **Step 1: Write ForumTopicListItem test**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import ForumTopicListItem from '../components/ForumTopicListItem'
import { ForumTopic } from '../types'

const mockTopic: ForumTopic = {
  id: 1,
  groupId: 123,
  title: 'General',
  iconColor: 0,
}

it('renders topic title', () => {
  render(<ForumTopicListItem topic={mockTopic} onClick={() => {}} />)
  expect(screen.getByText('General')).toBeInTheDocument()
})

it('shows Tema badge', () => {
  render(<ForumTopicListItem topic={mockTopic} onClick={() => {}} />)
  expect(screen.getByText('Tema')).toBeInTheDocument()
})

it('calls onClick when clicked', () => {
  const handleClick = jest.fn()
  render(<ForumTopicListItem topic={mockTopic} onClick={handleClick} />)
  fireEvent.click(screen.getByText('General'))
  expect(handleClick).toHaveBeenCalledWith(mockTopic)
})
```

- [ ] **Step 2: Write ForumTopicsPage test**

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import ForumTopicsPage from '../pages/ForumTopicsPage'
import { TelegramGroup } from '../types'

const mockGroup: TelegramGroup = {
  id: 123,
  title: 'Test Forum',
  isArchived: false,
  isOwner: true,
  isForum: true,
}

it('shows loading state initially', () => {
  render(<ForumTopicsPage group={mockGroup} onSelectTopic={() => {}} onBack={() => {}} />)
  expect(screen.getAllByRole('progressbar')).toHaveLength(3) // 3 skeletons
})

it('shows empty state when no topics', async () => {
  window.telegramAPI = { getForumTopics: jest.fn().mockResolvedValue([]) } as any
  render(<ForumTopicsPage group={mockGroup} onSelectTopic={() => {}} onBack={() => {}} />)
  await waitFor(() => {
    expect(screen.getByText('No hay temas en este forum')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All tests pass (including new ones)

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/
git commit -m "test: add unit tests for ForumTopicListItem and ForumTopicsPage"
```

---

## Task 9: Update E2E Tests

**Files:**
- Modify: `e2e/helpers.ts`
- Modify: `e2e/groups.spec.ts`

- [ ] **Step 1: Add forum test helper**

```typescript
// e2e/helpers.ts
export async function openForumTopics(page: any) {
  // Assumes we're on a forum group
  await page.waitForSelector('[data-testid="forum-topic-list-item"]', { timeout: 10000 })
}
```

- [ ] **Step 2: Add forum E2E test**

```typescript
// e2e/groups.spec.ts

test('forum group shows forum badge', async ({ page }) => {
  await waitForAppReady(page)
  // Look for a group with Forum badge
  const forumBadge = page.getByText('Forum').first()
  if (await forumBadge.isVisible().catch(() => false)) {
    await expect(forumBadge).toBeVisible()
  } else {
    test.skip(true, 'No forum groups in test account')
  }
})

test('clicking forum group shows topics', async ({ page }) => {
  await waitForAppReady(page)
  const forumGroups = page.locator('[data-testid="group-list-item"]', { hasText: 'Forum' })
  if (await forumGroups.count() === 0) {
    test.skip(true, 'No forum groups in test account')
  }
  await forumGroups.first().click()
  await page.waitForTimeout(500)
  // Should show topics or empty state
  await expect(page.getByText(/temas del forum|no hay temas/i).first()).toBeVisible()
})
```

- [ ] **Step 3: Commit**

```bash
git add e2e/helpers.ts e2e/groups.spec.ts
git commit -m "test: add E2E tests for forum topics navigation"
```

---

## Task 10: Final Integration Test

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test`
Expected: Existing tests pass, new forum tests may skip if no forum groups

- [ ] **Step 3: Manual test**

1. Launch app: `npm run dev`
2. Check if forum groups show "Forum" badge
3. Click a forum group → should see topics list
4. Click a topic → should see files filtered by topic
5. Click back → should return to topics list
6. Click back again → should return to group list

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete forum topics feature implementation"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Detect forum groups and show badge — Task 7
- ✅ Display topics as navigable list — Task 4
- ✅ Filter files by topic — Task 6
- ✅ Maintain navigation patterns — Task 5
- ✅ Minimal consistent changes — All tasks

**Placeholder scan:**
- ✅ No TBDs or TODOs
- ✅ All code is complete
- ✅ All test code included

**Type consistency:**
- ✅ `ForumTopic` interface used consistently
- ✅ `isForum` property added to `TelegramGroup`
- ✅ `getForumTopics` and `listFilesByTopic` signatures match

**No gaps found.**

---

**Plan saved to:** `docs/superpowers/plans/2026-06-12-forum-topics.md`

**Execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — Execute tasks in this session with checkpoints

**Which approach?**
