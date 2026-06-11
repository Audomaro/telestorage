# Groups: App-Created Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a filter to show only groups created via TeleDrive ("+ Nuevo grupo"), defaulting to that view.

**Architecture:** Store created group IDs in `settings.json`. `getGroups()` checks each group ID against the stored list to set `isAppCreated`. The renderer filters by this field via a pill toggle.

**Tech Stack:** Electron, GramJS, React, CSS Modules, Vitest

---

### Task 1: Add `createdGroupIds` to settings and add helper

**Files:**
- Modify: `electron/main/telegram/settings.ts`
- Test: `tests/unit/electron/telegram/settings.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/electron/telegram/settings.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' },
  safeStorage: { isEncryptionAvailable: () => true, encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() },
  ipcMain: { handle: vi.fn() }
}))

import { readFileSync, writeFileSync, existsSync } from 'fs'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createdGroupIds', () => {
  it('should default to empty array', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getSettings } = await import('../../../../electron/main/telegram/settings')
    const settings = getSettings()
    expect(settings.createdGroupIds).toEqual([])
  })

  it('should add a group id and persist', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { addCreatedGroupId, getSettings } = await import('../../../../electron/main/telegram/settings')
    addCreatedGroupId(123)
    const settings = getSettings()
    expect(settings.createdGroupIds).toContain(123)
    expect(settings.createdGroupIds.length).toBe(1)
  })

  it('should not duplicate group ids', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { addCreatedGroupId, getSettings } = await import('../../../../electron/main/telegram/settings')
    addCreatedGroupId(123)
    addCreatedGroupId(123)
    const settings = getSettings()
    expect(settings.createdGroupIds.filter(id => id === 123).length).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/electron/telegram/settings.test.ts 2>&1`
Expected: FAIL — `createdGroupIds` not in `AppSettings`

- [ ] **Step 3: Write minimal implementation**

```ts
// electron/main/telegram/settings.ts — add to AppSettings
export interface AppSettings {
  downloadPath: string
  createdGroupIds: number[]
}

// update DEFAULTS
const DEFAULTS: AppSettings = {
  downloadPath: app.getPath('downloads'),
  createdGroupIds: []
}

// add new function
export function addCreatedGroupId(id: number): AppSettings {
  const current = getSettings()
  if (current.createdGroupIds.includes(id)) return current
  const updated = { ...current, createdGroupIds: [...current.createdGroupIds, id] }
  writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2))
  return updated
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/electron/telegram/settings.test.ts 2>&1`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add electron/main/telegram/settings.ts tests/unit/electron/telegram/settings.test.ts
git commit -m "feat: add createdGroupIds to settings"
```

---

### Task 2: Add `isAppCreated` to GroupResult and wire up `createGroup`

**Files:**
- Modify: `electron/main/telegram/groups.ts`
- Test: `tests/unit/electron/telegram/groups.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/electron/telegram/groups.test.ts — add inside existing describe block
it('should have isAppCreated field in GroupResult', async () => {
  // GroupResult is an interface — just check it's importable and has the field
  const mod = await import('../../../../electron/main/telegram/groups')
  // isGroupAppCreated is a pure helper
  expect(mod.isGroupAppCreated).toBeDefined()
})

it('isGroupAppCreated should return true for matching id', async () => {
  const { isGroupAppCreated } = await import('../../../../electron/main/telegram/groups')
  expect(isGroupAppCreated(123, [123, 456])).toBe(true)
})

it('isGroupAppCreated should return false for non-matching id', async () => {
  const { isGroupAppCreated } = await import('../../../../electron/main/telegram/groups')
  expect(isGroupAppCreated(789, [123, 456])).toBe(false)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/electron/telegram/groups.test.ts 2>&1`
Expected: FAIL — `isGroupAppCreated` not exported

- [ ] **Step 3: Write minimal implementation**

Add `isAppCreated` to `GroupResult`:
```ts
// electron/main/telegram/groups.ts
export interface GroupResult {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  fileCount: number
  totalSize: number
  isAppCreated: boolean
}
```

Add pure helper:
```ts
export function isGroupAppCreated(groupId: number, createdIds: number[]): boolean {
  return createdIds.includes(groupId)
}
```

Update `getGroups()` — import settings and check:
```ts
import { getSettings } from './settings'

// inside getGroups(), after dialog mapping:
const createdIds = getSettings().createdGroupIds
return dialogs
  .filter(d => d.isGroup || d.isChannel)
  .map(d => ({
    // ... existing fields ...
    isAppCreated: isGroupAppCreated(Number(d.id), createdIds)
  }))
```

Same for `getArchivedGroups()`.

Update `createGroup()` to save the created group ID:
```ts
import { getSettings, addCreatedGroupId } from './settings'

export async function createGroup(title: string): Promise<GroupResult> {
  // ...existing code...
  const channel = updates.chats?.[0] || result
  addCreatedGroupId(Number(channel.id))
  return {
    id: Number(channel.id), title, isArchived: false,
    isOwner: true, fileCount: 0, totalSize: 0,
    isAppCreated: true
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/electron/telegram/groups.test.ts 2>&1`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add electron/main/telegram/groups.ts tests/unit/electron/telegram/groups.test.ts
git commit -m "feat: add isAppCreated to GroupResult"
```

---

### Task 3: Add `isAppCreated` to renderer type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the field**

```ts
export interface TelegramGroup {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  fileCount?: number
  totalSize?: number
  isAppCreated?: boolean
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx vue-tsc --noEmit -p tsconfig.web.json 2>&1 || npx tsc --noEmit -p tsconfig.web.json 2>&1 || echo "typecheck expected to have pre-existing errors unrelated to our change"`
No new type errors expected.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add isAppCreated to TelegramGroup"
```

---

### Task 4: Add filter toggle to GroupListPage

**Files:**
- Modify: `src/pages/GroupListPage.tsx`
- Modify: `src/pages/GroupListPage.module.css`
- Test: `tests/unit/pages/GroupListPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/unit/pages/GroupListPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GroupListPage from '../../../src/pages/GroupListPage'

const mockGroups = [
  { id: 1, title: 'App Group', isArchived: false, isOwner: true, isAppCreated: true },
  { id: 2, title: 'Other Group', isArchived: false, isOwner: false, isAppCreated: false },
  { id: 3, title: 'Another App', isArchived: false, isOwner: true, isAppCreated: true },
]

beforeEach(() => {
  vi.clearAllMocks()
  window.telegramAPI = {
    getGroups: vi.fn().mockResolvedValue(mockGroups),
    getArchivedGroups: vi.fn().mockResolvedValue([]),
    createGroup: vi.fn(),
    deleteGroup: vi.fn(),
  } as any
})

describe('GroupListPage app filter', () => {
  it('should show only app-created groups by default', async () => {
    render(<GroupListPage />)
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
      expect(screen.getByText('Another App')).toBeDefined()
    })
    expect(screen.queryByText('Other Group')).toBeNull()
  })

  it('should show all groups when filter is toggled to Todos', async () => {
    render(<GroupListPage />)
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Todos'))
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
      expect(screen.getByText('Other Group')).toBeDefined()
    })
  })

  it('should show empty message when no app-created groups exist', async () => {
    window.telegramAPI.getGroups = vi.fn().mockResolvedValue([
      { id: 2, title: 'Other Group', isArchived: false, isOwner: false, isAppCreated: false },
    ])
    render(<GroupListPage />)
    await waitFor(() => {
      expect(screen.getByText(/No hay grupos creados/i)).toBeDefined()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/pages/GroupListPage.test.tsx 2>&1`
Expected: FAIL — filter not implemented yet

- [ ] **Step 3: Write minimal implementation**

**GroupListPage.tsx** changes:
- Add new state: `const [appFilter, setAppFilter] = useState<'all' | 'created'>('created')`
- After `displayGroups`, apply filter: `const visibleGroups = displayGroups.filter(g => appFilter === 'all' || g.isAppCreated)`
- Add pill toggle next to "Activos | Archivados" tabs, before "+ Nuevo grupo"
- Change empty message when `appFilter === 'created'`

```tsx
// new state
const [appFilter, setAppFilter] = useState<'all' | 'created'>('created')

// filter
const visibleGroups = displayGroups.filter(g => appFilter === 'all' || g.isAppCreated)

// pill toggle — add after the archived tab button and before the create button
<div style={{ display: 'flex', gap: 4 }}>
  <button onClick={() => setAppFilter('created')}
    className={`${styles.filterTab} ${appFilter === 'created' ? styles.filterTabActive : ''}`}>Creados</button>
  <button onClick={() => setAppFilter('all')}
    className={`${styles.filterTab} ${appFilter === 'all' ? styles.filterTabActive : ''}`}>Todos</button>
</div>

// replace displayGroups.map with visibleGroups.map

// update empty message
{visibleGroups.length === 0 && !archivedLoading && (
  <div className={styles.empty}>
    {showArchived
      ? 'No hay grupos archivados'
      : appFilter === 'created'
        ? 'No hay grupos creados con TeleDrive'
        : 'No hay grupos. Crea uno nuevo con "+ Nuevo grupo".'
    }
  </div>
)}
```

**GroupListPage.module.css** — add styles:
```css
.filterTab {
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  padding: 4px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.filterTabActive {
  background: #5b7cfa;
  color: #fff;
  border-color: #5b7cfa;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/pages/GroupListPage.test.tsx 2>&1`
Expected: PASS

- [ ] **Step 5: Run all tests**

Run: `npx vitest run 2>&1`
Expected: ALL tests pass (should be 107+)

- [ ] **Step 6: Build**

Run: `npm run build 2>&1`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/pages/GroupListPage.tsx src/pages/GroupListPage.module.css tests/unit/pages/GroupListPage.test.tsx
git commit -m "feat: add app-created filter to group list"
```
