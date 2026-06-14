# Delete Forum Topics Implementation Plan

**Goal:** Add ability to delete forum topics in owned groups via delete IconButton + confirmation Dialog.

**Architecture:** GramJS `channels.DeleteForumTopic` → IPC handler → preload bridge → React UI with confirmation Dialog.

---

### File Structure

| File | Change |
|------|--------|
| `electron/main/telegram/groups.ts` | Add `deleteForumTopic()` |
| `electron/main/ipc.ts` | Add `groups:deleteTopic` handler |
| `electron/preload/index.ts` | Add `deleteTopic` bridge |
| `src/types/electron.d.ts` | Add `deleteTopic` to `TelegramAPI` |
| `src/components/ForumTopicListItem.tsx` | Add delete IconButton + confirmation Dialog |
| `src/pages/ForumTopicsPage.tsx` | Add delete handler with snackbar + list refresh |

### Task 1: Backend

`electron/main/telegram/groups.ts` — after `renameForumTopic`, add:

```ts
export async function deleteForumTopic(groupId: number, topicId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')
  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))
  await client.invoke(
    new (await import('telegram')).Api.channels.DeleteForumTopic({ channel: channelId, topicId })
  )
}
```

### Task 2: IPC

Update import to include `deleteForumTopic`. Add handler:

```ts
ipcMain.handle('groups:deleteTopic', async (_event, groupId: number, topicId: number) => {
  return deleteForumTopic(groupId, topicId)
})
```

### Task 3: Preload

```ts
  deleteTopic: (groupId: number, topicId: number) => ipcRenderer.invoke('groups:deleteTopic', groupId, topicId),
```

### Task 4: Types

```ts
  deleteTopic(groupId: number, topicId: number): Promise<void>
```

### Task 5: ForumTopicListItem

Add imports: `DialogContentText`, `DeleteIcon`. Add `onDelete` prop. Add delete IconButton gated by `onDelete && canRename`. Add confirmation Dialog with `DialogContentText` ("¿Estás seguro de eliminar...?").

### Task 6: ForumTopicsPage

Add `handleDeleteTopic`:

```tsx
const handleDeleteTopic = useCallback(async (topic: ForumTopic) => {
  try {
    await window.telegramAPI.deleteTopic(group.id, topic.id)
    setTopics(prev => prev.filter(t => t.id !== topic.id))
    showSnackbar('Tema eliminado correctamente', 'success')
  } catch (err: any) {
    showSnackbar(err.message || 'Error al eliminar tema', 'error')
  }
}, [group.id, showSnackbar])
```

Pass `onDelete={handleDeleteTopic}` to `ForumTopicListItem`.

### Task 7: Verify

`npm run typecheck:web && npm run typecheck:node && npm test` — all pass.
