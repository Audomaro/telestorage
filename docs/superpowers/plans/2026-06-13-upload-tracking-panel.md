# Upload Tracking Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add upload progress tracking alongside downloads in a combined "Transferencias" panel, toggled by the existing AppBar download icon.

**Architecture:** New `UploadContext` mirrors `DownloadContext`. GramJS `sendFile` accepts `progressCallback` — IPC handler uses `event.sender.send` to push progress events (same pattern as download). Combined `TransferPanel` replaces `DownloadPanel` with MUI Tabs for "Descargas" / "Subidas" sections.

**Tech Stack:** GramJS, Electron IPC, React Context, MUI Tabs

---

### Task 1: UploadContext

**Files:**
- Create: `src/theme/UploadContext.tsx`
- Test: `src/theme/__tests__/UploadContext.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/theme/__tests__/UploadContext.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { UploadProvider, useUpload } from '../UploadContext'

function renderCtx() {
  return renderHook(() => useUpload(), {
    wrapper: ({ children }: { children: ReactNode }) => <UploadProvider>{children}</UploadProvider>,
  })
}

describe('UploadContext', () => {
  it('starts with empty uploads', () => {
    const { result } = renderCtx()
    expect(result.current.uploads).toEqual([])
  })

  it('adds an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    expect(result.current.uploads).toHaveLength(1)
    expect(result.current.uploads[0]).toMatchObject({ id: 'u1', fileName: 'test.pdf', progress: 0, status: 'uploading' })
  })

  it('updates progress', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.updateProgress('u1', 0.5))
    expect(result.current.uploads[0].progress).toBe(0.5)
  })

  it('completes an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.completeUpload('u1'))
    expect(result.current.uploads[0].status).toBe('completed')
    expect(result.current.uploads[0].progress).toBe(1)
  })

  it('fails an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.failUpload('u1', 'Network error'))
    expect(result.current.uploads[0].status).toBe('error')
    expect(result.current.uploads[0].error).toBe('Network error')
  })

  it('removes an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.removeUpload('u1'))
    expect(result.current.uploads).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/theme/__tests__/UploadContext.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

Create `src/theme/UploadContext.tsx`:

```tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type UploadStatus = 'uploading' | 'completed' | 'error'

export interface UploadTask {
  id: string
  fileName: string
  progress: number
  status: UploadStatus
  error?: string
  completedAt?: number
}

export interface UploadContextValue {
  uploads: UploadTask[]
  addUpload: (id: string, fileName: string) => void
  updateProgress: (id: string, progress: number) => void
  completeUpload: (id: string) => void
  failUpload: (id: string, error: string) => void
  removeUpload: (id: string) => void
}

const UploadContext = createContext<UploadContextValue>({
  uploads: [],
  addUpload: () => {},
  updateProgress: () => {},
  completeUpload: () => {},
  failUpload: () => {},
  removeUpload: () => {},
})

export const useUpload = () => useContext(UploadContext)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadTask[]>([])

  const addUpload = useCallback((id: string, fileName: string) => {
    setUploads(prev => [...prev, { id, fileName, progress: 0, status: 'uploading' }])
  }, [])

  const updateProgress = useCallback((id: string, progress: number) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u))
  }, [])

  const completeUpload = useCallback((id: string) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'completed', progress: 1, completedAt: Date.now() } : u))
  }, [])

  const failUpload = useCallback((id: string, error: string) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error } : u))
  }, [])

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }, [])

  return (
    <UploadContext.Provider value={{ uploads, addUpload, updateProgress, completeUpload, failUpload, removeUpload }}>
      {children}
    </UploadContext.Provider>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/theme/__tests__/UploadContext.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/theme/UploadContext.tsx src/theme/__tests__/UploadContext.test.tsx
git commit -m "feat: add UploadContext for upload progress tracking"
```

---

### Task 2: Add uploadFileWithProgress to backend

**Files:**
- Modify: `electron/main/telegram/files.ts`

- [ ] **Step 1: Add `uploadFileWithProgress` function**

Add after `uploadFile` in `electron/main/telegram/files.ts`:

```ts
export async function uploadFileWithProgress(
  groupId: number,
  filePath: string,
  topicId: number | undefined,
  progressCb?: (progress: number) => void
): Promise<{ messageId: number }> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')
  if (!filePath) throw new Error('No file path specified')

  const result = await client.sendFile(groupId, {
    file: filePath,
    forceDocument: true,
    ...(topicId ? { replyTo: topicId, topMsgId: topicId } : {}),
    progressCallback: progressCb,
  })
  return { messageId: result.id }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors (or only pre-existing errors)

- [ ] **Step 3: Commit**

```bash
git add electron/main/telegram/files.ts
git commit -m "feat: add uploadFileWithProgress with progressCallback"
```

---

### Task 3: IPC handlers for upload with progress

**Files:**
- Modify: `electron/main/ipc.ts`

- [ ] **Step 1: Add IPC handlers `files:upload:start` and `files:uploadTemp:start`**

In `electron/main/ipc.ts`, add after the existing `files:upload` handler:

```ts
ipcMain.handle('files:upload:start', async (event, { uploadId, groupId, filePath, topicId }: { uploadId: string; groupId: number; filePath: string; topicId?: number }) => {
  return uploadFileWithProgress(groupId, filePath, topicId, (progress) => {
    event.sender.send('files:upload:progress', { uploadId, progress })
  })
})

ipcMain.handle('files:uploadTemp:start', async (event, { uploadId, groupId, fileName, data, topicId }: { uploadId: string; groupId: number; fileName: string; data: number[]; topicId?: number }) => {
  const tempDir = join(app.getPath('temp'), 'telestorage_uploads')
  const { mkdir, writeFile, unlink } = await import('fs/promises')
  await mkdir(tempDir, { recursive: true })
  const destPath = join(tempDir, fileName)
  await writeFile(destPath, Buffer.from(data))
  try {
    const result = await uploadFileWithProgress(groupId, destPath, topicId, (progress) => {
      event.sender.send('files:upload:progress', { uploadId, progress })
    })
    return result
  } finally {
    await unlink(destPath).catch(() => {})
  }
})
```

Update the import line to include `uploadFileWithProgress`:

```ts
import { listFiles, listFilesBatch, listFilesByTopic, uploadFile, uploadMultipleFiles, uploadFileWithProgress, downloadFile, downloadFileWithProgress, downloadThumbnail, deleteFile } from './telegram/files'
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add electron/main/ipc.ts
git commit -m "feat: add files:upload:start and files:uploadTemp:start IPC handlers"
```

---

### Task 4: Preload bridge for upload progress

**Files:**
- Modify: `electron/preload/index.ts`

- [ ] **Step 1: Add `uploadFileWithProgress` and `uploadTempFileWithProgress` to preload**

In `electron/preload/index.ts`, add after `uploadTempFile`:

```ts
uploadFileWithProgress: (groupId: number, filePath: string, topicId: number | undefined, onProgress: (p: number) => void) => {
  const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const handler = (_event: any, data: any) => {
    if (data.uploadId === uploadId) {
      onProgress(data.progress)
    }
  }
  ipcRenderer.on('files:upload:progress', handler)
  return ipcRenderer.invoke('files:upload:start', { uploadId, groupId, filePath, topicId })
    .finally(() => {
      ipcRenderer.removeListener('files:upload:progress', handler)
    })
},
uploadTempFileWithProgress: (groupId: number, fileName: string, data: number[], topicId: number | undefined, onProgress: (p: number) => void) => {
  const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const handler = (_event: any, data: any) => {
    if (data.uploadId === uploadId) {
      onProgress(data.progress)
    }
  }
  ipcRenderer.on('files:upload:progress', handler)
  return ipcRenderer.invoke('files:uploadTemp:start', { uploadId, groupId, fileName, data, topicId })
    .finally(() => {
      ipcRenderer.removeListener('files:upload:progress', handler)
    })
},
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add electron/preload/index.ts
git commit -m "feat: add uploadFileWithProgress preload bridge"
```

---

### Task 5: Update TelegramAPI type declarations

**Files:**
- Modify: `src/types/electron.d.ts`

- [ ] **Step 1: Add new methods to TelegramAPI interface**

In `src/types/electron.d.ts`, add after `uploadTempFile`:

```ts
  uploadFileWithProgress(groupId: number, filePath: string, topicId: number | undefined, onProgress: (p: number) => void): Promise<any>
  uploadTempFileWithProgress(groupId: number, fileName: string, data: number[], topicId: number | undefined, onProgress: (p: number) => void): Promise<any>
```

- [ ] **Step 2: Commit**

```bash
git add src/types/electron.d.ts
git commit -m "feat: add uploadFileWithProgress types"
```

---

### Task 6: TransferItem (replaces DownloadItem)

**Files:**
- Create: `src/components/TransferItem.tsx`
- Delete: `src/components/DownloadItem.tsx`

- [ ] **Step 1: Create TransferItem**

Create `src/components/TransferItem.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { DownloadTask } from '../theme/DownloadContext'
import { UploadTask } from '../theme/UploadContext'

type TransferTask = DownloadTask | UploadTask

interface TransferItemProps {
  task: TransferTask
  type: 'download' | 'upload'
  onRemove: () => void
  onOpenFolder?: () => void
}

export default function TransferItem({ task, type, onRemove, onOpenFolder }: TransferItemProps) {
  const isCompleted = task.status === 'completed'
  const isError = task.status === 'error'

  const onRemoveRef = useRef(onRemove)
  onRemoveRef.current = onRemove

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => onRemoveRef.current(), 10000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5, borderBottom: '1px solid rgba(0, 136, 204, 0.08)', transition: 'all 200ms', '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.02)' } }} data-testid="transfer-item">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isCompleted ? <CheckCircleIcon fontSize="small" sx={{ color: '#0088cc' }} /> : isError ? <ErrorIcon fontSize="small" color="error" /> : <InsertDriveFileIcon fontSize="small" sx={{ color: '#0088cc' }} />}
        <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: 600, color: '#222222' }}>{task.fileName}</Typography>
        {type === 'download' && isCompleted && onOpenFolder && (
          <Tooltip title="Abrir carpeta">
            <IconButton size="small" onClick={onOpenFolder} aria-label="Abrir carpeta" sx={{ '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.08)' } }}><FolderOpenIcon fontSize="small" sx={{ color: '#0088cc' }} /></IconButton>
          </Tooltip>
        )}
        <Tooltip title="Eliminar">
          <IconButton size="small" onClick={onRemove} aria-label="Eliminar" sx={{ '&:hover': { backgroundColor: 'rgba(243, 115, 22, 0.08)' } }}><CloseIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={isCompleted ? 100 : isError ? 100 : Math.round(task.progress * 100)}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(0, 136, 204, 0.12)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: isCompleted ? '#0088cc' : isError ? '#EF4444' : '#0088cc',
              borderRadius: 3,
              transition: 'transform 200ms',
            }
          }}
        />
        <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right', color: '#222222', fontWeight: 500 }}>
          {isCompleted ? '100%' : isError ? 'Error' : `${Math.round(task.progress * 100)}%`}
        </Typography>
      </Box>
      {isError && (
        <Typography variant="caption" sx={{ color: '#EF4444' }}>{task.error}</Typography>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Delete `src/components/DownloadItem.tsx`**

```bash
git rm src/components/DownloadItem.tsx
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors (ignore failing tests from deleted DownloadItem imports)

- [ ] **Step 4: Commit**

```bash
git add src/components/TransferItem.tsx
git commit -m "feat: add TransferItem (replaces DownloadItem) for upload/download items"
```

---

### Task 7: TransferPanel (replaces DownloadPanel)

**Files:**
- Create: `src/components/TransferPanel.tsx`
- Delete: `src/components/DownloadPanel.tsx`

- [ ] **Step 1: Create TransferPanel with tabs**

Create `src/components/TransferPanel.tsx`:

```tsx
import { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useDownload } from '../theme/DownloadContext'
import { useUpload } from '../theme/UploadContext'
import TransferItem from './TransferItem'

export default function TransferPanel() {
  const [tab, setTab] = useState(0)
  const { downloads, removeDownload } = useDownload()
  const { uploads, removeUpload } = useUpload()

  const completedDownloads = useMemo(() => downloads.filter(d => d.status === 'completed'), [downloads])
  const completedUploads = useMemo(() => uploads.filter(u => u.status === 'completed'), [uploads])

  const handleClearDownloads = () => {
    completedDownloads.forEach(d => removeDownload(d.id))
  }

  const handleClearUploads = () => {
    completedUploads.forEach(u => removeUpload(u.id))
  }

  const handleOpenFolder = (destPath: string) => {
    window.telegramAPI.showInFolder(destPath)
  }

  return (
    <Paper
      elevation={0}
      data-testid="transfer-panel"
      sx={{
        height: '100%',
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(0, 136, 204, 0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.5, fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', color: '#666', '&.Mui-selected': { color: '#0088cc' } }, '& .MuiTabs-indicator': { backgroundColor: '#0088cc' } }}>
        <Tab label="Descargas" />
        <Tab label="Subidas" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid rgba(0, 136, 204, 0.12)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#222222' }}>Descargas</Typography>
            {completedDownloads.length > 0 && (
              <Button size="small" onClick={handleClearDownloads} sx={{ color: '#0088cc', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.08)' } }}>Limpiar</Button>
            )}
          </Box>
          <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain' }}>
            {downloads.length === 0 ? (
              <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: '#222222', opacity: 0.6 }}>
                Sin descargas activas
              </Typography>
            ) : (
              downloads.map(task => (
                <TransferItem
                  key={task.id}
                  task={task}
                  type="download"
                  onRemove={() => removeDownload(task.id)}
                  onOpenFolder={() => task.destPath && handleOpenFolder(task.destPath)}
                />
              ))
            )}
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid rgba(0, 136, 204, 0.12)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#222222' }}>Subidas</Typography>
            {completedUploads.length > 0 && (
              <Button size="small" onClick={handleClearUploads} sx={{ color: '#0088cc', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.08)' } }}>Limpiar</Button>
            )}
          </Box>
          <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain' }}>
            {uploads.length === 0 ? (
              <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: '#222222', opacity: 0.6 }}>
                Sin subidas activas
              </Typography>
            ) : (
              uploads.map(task => (
                <TransferItem
                  key={task.id}
                  task={task}
                  type="upload"
                  onRemove={() => removeUpload(task.id)}
                />
              ))
            )}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
```

- [ ] **Step 2: Delete `src/components/DownloadPanel.tsx`**

```bash
git rm src/components/DownloadPanel.tsx
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/TransferPanel.tsx
git commit -m "feat: add TransferPanel with Descargas/Subidas tabs (replaces DownloadPanel)"
```

---

### Task 8: Wire UploadProvider and TransferPanel in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace DownloadPanel with TransferPanel, add UploadProvider**

In `src/App.tsx`:

Replace imports:
```tsx
import { DownloadProvider } from './theme/DownloadContext'
import DownloadPanel from './components/DownloadPanel'
```
with:
```tsx
import { DownloadProvider } from './theme/DownloadContext'
import { UploadProvider } from './theme/UploadContext'
import TransferPanel from './components/TransferPanel'
```

Wrap content with `UploadProvider` inside `DownloadProvider`:
```tsx
<DownloadProvider>
  <UploadProvider>
    ...
  </UploadProvider>
</DownloadProvider>
```

Replace `<DownloadPanel />` with `<TransferPanel />`:
```tsx
{showDownloads && (
  <Box sx={{ flexShrink: 0 }}>
    <TransferPanel />
  </Box>
)}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire UploadProvider and TransferPanel in App"
```

---

### Task 9: Update UploadDialog for background uploads with progress

**Files:**
- Modify: `src/components/UploadDialog.tsx`

- [ ] **Step 1: Rewrite UploadDialog to use UploadContext and close immediately**

Replace `src/components/UploadDialog.tsx` with:

```tsx
import { useState, DragEvent } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar } from '../theme/SnackbarContext'
import { useUpload } from '../theme/UploadContext'

interface UploadDialogProps {
  groupId: number
  onClose: () => void
  onUploadComplete: () => void
  topicId?: number
}

function processDroppedFiles(dropped: FileList): Promise<{ name: string; path?: string; data?: number[] }[]> {
  const files = Array.from(dropped)
  return Promise.all(files.map(f => {
    if ((f as any).path) return { name: f.name, path: (f as any).path }
    return f.arrayBuffer().then(buf => ({ name: f.name, data: Array.from(new Uint8Array(buf)) }))
  }))
}

export default function UploadDialog({ groupId, onClose, onUploadComplete, topicId }: UploadDialogProps) {
  const [files, setFiles] = useState<{ name: string; path?: string; data?: number[] }[]>([])
  const [uploading, setUploading] = useState(false)
  const { showSnackbar } = useSnackbar()
  const { addUpload, updateProgress, completeUpload, failUpload } = useUpload()

  const handlePick = async () => {
    const paths: string[] = await window.telegramAPI.pickFiles()
    if (paths && paths.length > 0) {
      setFiles(prev => [...prev, ...paths.map(p => ({ name: p.split(/[\\/]/).pop() || p, path: p }))])
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const tooBig = Array.from(e.dataTransfer.files).filter(f => {
      if ((f as any).path) return false
      return f.size > 100 * 1024 * 1024
    })
    tooBig.forEach(f => showSnackbar(`"${f.name}" es demasiado grande para arrastrar (máx. 100 MB)`, 'warning'))

    const valid = Array.from(e.dataTransfer.files).filter(f => {
      if ((f as any).path) return true
      return f.size <= 100 * 1024 * 1024
    })
    if (valid.length === 0) return
    processDroppedFiles(valid as unknown as FileList).then(results => {
      setFiles(prev => [...prev, ...results])
    })
  }

  const handleUpload = () => {
    if (files.length === 0 || uploading) return
    setUploading(true)

    files.forEach(f => {
      const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      addUpload(uploadId, f.name)

      const uploadPromise = f.path
        ? window.telegramAPI.uploadFileWithProgress(groupId, f.path, topicId, (p) => updateProgress(uploadId, p))
        : f.data
          ? window.telegramAPI.uploadTempFileWithProgress(groupId, f.name, f.data, topicId, (p) => updateProgress(uploadId, p))
          : Promise.resolve()

      uploadPromise
        .then(() => completeUpload(uploadId))
        .catch((err: any) => failUpload(uploadId, err.message || 'Error al subir'))
    })

    showSnackbar(`${files.length} archivo(s) agregados a la cola de subida`, 'success')
    onUploadComplete()
  }

  return (
    <Dialog open onClose={uploading ? undefined : onClose} maxWidth="sm" fullWidth data-testid="upload-dialog"
      sx={{
        '& .MuiPaper-root': {
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0, 136, 204, 0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          transition: 'all 200ms',
        },
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, color: '#222222' }}>{uploading ? 'Iniciando subidas...' : 'Subir archivos'}</DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Box
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          sx={{
            border: '2px dashed',
            borderColor: '#0088cc',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            mb: 2,
            cursor: 'pointer',
            transition: 'all 200ms',
            '&:hover': {
              borderStyle: 'solid',
              backgroundColor: 'rgba(0, 136, 204, 0.04)',
            }
          }}
          onClick={handlePick}
          data-testid="upload-dropzone"
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: '#0088cc', mb: 1 }} />
          <Typography color="#222222">Arrastra archivos aquí o haz clic para seleccionar</Typography>
        </Box>
        {files.length > 0 && (
          <List dense sx={{ '& .MuiListItem-root': { borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.04)' } } }}>
            {files.map((f, i) => (
              <ListItem key={i} secondaryAction={
                <IconButton edge="end" size="small" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                  sx={{ '&:hover': { backgroundColor: 'rgba(243, 115, 22, 0.08)' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }>
                <ListItemText primary={f.name} primaryTypographyProps={{ variant: 'body2', sx: { color: '#222222' } }} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading} variant="outlined" sx={{ color: '#222222', borderColor: 'rgba(34, 34, 34, 0.3)', borderRadius: '8px', fontWeight: 600, transition: 'all 200ms', '&:hover': { borderColor: '#222222', backgroundColor: 'rgba(34, 34, 34, 0.04)' } }}>Cancelar</Button>
        <Button onClick={handleUpload} variant="contained" disabled={files.length === 0 || uploading}
          sx={{ backgroundColor: '#F97316', borderRadius: '8px', fontWeight: 600, transition: 'all 200ms', '&:hover': { backgroundColor: '#EA580C', transform: 'translateY(-1px)' }, '&.Mui-disabled': { backgroundColor: 'rgba(249, 115, 22, 0.4)' } }}
        >
          {uploading ? 'Iniciando...' : 'Subir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

Key changes:
- Imports `useUpload` and uses `addUpload`, `updateProgress`, `completeUpload`, `failUpload`
- Calls `uploadFileWithProgress`/`uploadTempFileWithProgress` instead of non-progress versions
- `handleUpload` fires uploads and calls `onUploadComplete()` immediately — dialog closes, uploads run in background
- Upload progress visible in TransferPanel ("Subidas" tab)

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors (import `ListItemText` is used)

- [ ] **Step 3: Commit**

```bash
git add src/components/UploadDialog.tsx
git commit -m "feat: UploadDialog uses uploadFileWithProgress and UploadContext"
```

---

### Task 10: Update tests for renamed/removed components

**Files:**
- Modify: any test files referencing `DownloadPanel`, `DownloadItem`

- [ ] **Step 1: Find and update test imports**

Run: `rg "DownloadPanel|DownloadItem" src/ --include "*.test.tsx" --include "*.test.ts"`

If any tests import `DownloadPanel` or `DownloadItem`, update them to import `TransferPanel` or `TransferItem` instead.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit if changes were made**

```bash
git commit -am "test: update imports for TransferPanel/TransferItem"
```

---

### Task 11: Final verification

- [ ] **Step 1: TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Build check** (optional)

Run: `npm run build` (if available)
Expected: Build succeeds
