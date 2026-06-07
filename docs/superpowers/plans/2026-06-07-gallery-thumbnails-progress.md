# Gallery Thumbnails & Download Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show actual image thumbnails in gallery grid, download on click with circular progress overlay.

**Architecture:** Extract thumbnail bytes from Telegram media during file listing → display as `<img>` in grid → click triggers IPC download with `progressCallback` → progress events flow via `webContents.send()` → `CircularProgress` SVG overlay.

**Tech Stack:** Electron, GramJS, React, TypeScript, SVG

---

### Task 1: Thumbnail extraction in listFiles

**Files:**
- Modify: `electron/main/telegram/files.ts`
- Test: `tests/unit/electron/telegram/files.test.ts`

- [ ] **Write test for thumbnail extraction from PhotoStrippedSize**

Add to `tests/unit/electron/telegram/files.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  safeStorage: { isEncryptionAvailable: () => true, encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() },
  app: { getPath: () => '/tmp' },
  ipcMain: { handle: vi.fn() }
}))

describe('downloadFileWithProgress', () => {
  it('should accept progress callback', async () => {
    const mod = await import('../../../../electron/main/telegram/files')
    expect(mod.downloadFileWithProgress).toBeDefined()
  })
})

describe('thumbnail extraction', () => {
  it('should extract thumbnail data URL from PhotoStrippedSize', async () => {
    const { extractThumbnail } = await import('../../../../electron/main/telegram/files')

    const mockMedia = {
      photo: {
        sizes: [
          { className: 'PhotoStrippedSize', type: 'i', bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0]) }
        ]
      }
    }
    const result = extractThumbnail(mockMedia as any)
    expect(result).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('should return null for media without thumbnail', async () => {
    const { extractThumbnail } = await import('../../../../electron/main/telegram/files')
    const result = extractThumbnail({ document: { mimeType: 'application/pdf' } } as any)
    expect(result).toBeNull()
  })

  it('should return null for missing photo sizes', async () => {
    const { extractThumbnail } = await import('../../../../electron/main/telegram/files')
    const result = extractThumbnail({ photo: { sizes: [] } } as any)
    expect(result).toBeNull()
  })
})
```

- [ ] **Run tests to verify they fail**

Run: `npx vitest run tests/unit/electron/telegram/files.test.ts --reporter=verbose`
Expected: FAIL — `extractThumbnail` not exported

- [ ] **Implement `extractThumbnail` helper and update `listFiles`**

In `electron/main/telegram/files.ts`, add at the top (before `export interface FileResult`):

```typescript
export function extractThumbnail(media: any): string | null {
  if (!media) return null

  // Photos: extract from PhotoStrippedSize (type='i')
  if (media.photo?.sizes) {
    const stripped = media.photo.sizes.find((s: any) =>
      s.className === 'PhotoStrippedSize' || s.type === 'i'
    )
    if (stripped?.bytes) {
      const bytes = stripped.bytes instanceof Buffer
        ? stripped.bytes
        : Buffer.from(stripped.bytes)
      return `data:image/jpeg;base64,${bytes.toString('base64')}`
    }
  }

  // Documents with thumbs
  if (media.document?.thumbs) {
    const thumb = media.document.thumbs.find((t: any) => t.bytes)
    if (thumb?.bytes) {
      const bytes = thumb.bytes instanceof Buffer
        ? thumb.bytes
        : Buffer.from(thumb.bytes)
      return `data:image/jpeg;base64,${bytes.toString('base64')}`
    }
  }

  return null
}
```

In the `listFiles` function, set `thumbnail` on the returned object:

```typescript
return {
  id: m.id, messageId: m.id, name, size, mimeType,
  date: new Date(m.date * 1000), groupId,
  thumbnail: extractThumbnail(media)
}
```

- [ ] **Add `downloadFileWithProgress` function**

In `electron/main/telegram/files.ts`, add:

```typescript
export async function downloadFileWithProgress(
  groupId: number, messageId: number, destPath: string,
  progressCb?: (progress: number) => void
): Promise<string> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { ids: messageId })
  if (messages.length === 0) throw new Error('Message not found')

  const media = messages[0].media
  if (!media) throw new Error('No media in message')

  const { mkdir, readFile } = await import('fs/promises')
  const { join, dirname, extname } = await import('path')

  await mkdir(dirname(destPath), { recursive: true })

  await client.downloadMedia(media, {
    outputFile: destPath,
    progressCallback: progressCb
  })

  return destPath
}
```

- [ ] **Update exports in files.ts** — `extractThumbnail` and `downloadFileWithProgress` are already exported above.

- [ ] **Run tests to verify they pass**

Run: `npx vitest run tests/unit/electron/telegram/files.test.ts --reporter=verbose`
Expected: PASS (all tests)

- [ ] **Commit**

```bash
git add -A && git commit -m "feat: add thumbnail extraction and downloadFileWithProgress"
```

---

### Task 2: Download IPC with progress

**Files:**
- Modify: `electron/main/ipc.ts`
- Modify: `electron/preload/index.ts`
- Modify: `src/types/electron.d.ts`

- [ ] **Register `files:download:start` IPC handler**

In `electron/main/ipc.ts`, replace the existing `files:download` handler:

```typescript
import { ipcMain } from 'electron'
import { initClient, startClient, startPhoneAuth, verifyPhoneCode, verify2FAPassword, getAuthState, getSession, logout, setLoggedIn } from './telegram/auth'
import { saveSession, loadSession, clearSession } from './telegram/storage'
import { getGroups, getArchivedGroups, createGroup } from './telegram/groups'
import { listFiles, uploadFile, downloadFileWithProgress, deleteFile, forwardFile } from './telegram/files'

// ... keep all other handlers, replace the files:download handler:

  ipcMain.handle('files:download:start', async (event, { downloadId, groupId, messageId, destPath }) => {
    return downloadFileWithProgress(groupId, messageId, destPath, (progress) => {
      event.sender.send('files:download:progress', { downloadId, progress })
    })
  })
```

Also remove the old `files:download` handler (or keep it for backward compat — remove it since nothing uses it anymore).

- [ ] **Update preload to expose `downloadFileWithProgress`**

In `electron/preload/index.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('telegramAPI', {
  init: () => ipcRenderer.invoke('auth:init'),
  sendCode: (phone: string) => ipcRenderer.invoke('auth:sendCode', phone),
  verifyCode: (phone: string, code: string, codeHash: string) =>
    ipcRenderer.invoke('auth:verifyCode', phone, code, codeHash),
  check2FA: (password: string) => ipcRenderer.invoke('auth:check2FA', password),
  getAuthState: () => ipcRenderer.invoke('auth:getState'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getGroups: () => ipcRenderer.invoke('groups:list'),
  getArchivedGroups: () => ipcRenderer.invoke('groups:listArchived'),
  createGroup: (title: string) => ipcRenderer.invoke('groups:create', title),
  listFiles: (groupId: number) => ipcRenderer.invoke('files:list', groupId),
  uploadFile: (groupId: number, filePath: string) => ipcRenderer.invoke('files:upload', groupId, filePath),
  downloadFile: (groupId: number, messageId: number, destPath: string) =>
    ipcRenderer.invoke('files:download', groupId, messageId, destPath),
  downloadFileWithProgress: (groupId: number, messageId: number, destPath: string, onProgress: (p: number) => void) => {
    const downloadId = `${messageId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const handler = (_event: any, data: any) => {
      if (data.downloadId === downloadId) {
        onProgress(data.progress)
      }
    }
    ipcRenderer.on('files:download:progress', handler)
    return ipcRenderer.invoke('files:download:start', { downloadId, groupId, messageId, destPath })
      .finally(() => {
        ipcRenderer.removeListener('files:download:progress', handler)
      })
  },
  deleteFile: (groupId: number, messageId: number) => ipcRenderer.invoke('files:delete', groupId, messageId),
  forwardFile: (fromGroupId: number, toGroupId: number, messageId: number) =>
    ipcRenderer.invoke('files:forward', fromGroupId, toGroupId, messageId),
})
```

- [ ] **Update type declarations**

In `src/types/electron.d.ts`, add `downloadFileWithProgress`:

```typescript
interface TelegramAPI {
  init(): Promise<{ initialized: boolean; error?: string }>
  sendCode(phone: string): Promise<{ codeHash: string }>
  verifyCode(phone: string, code: string, codeHash: string): Promise<{ needs2FA: boolean }>
  check2FA(password: string): Promise<void>
  getAuthState(): Promise<AuthState>
  logout(): Promise<void>
  getGroups(): Promise<any[]>
  getArchivedGroups(): Promise<any[]>
  createGroup(title: string): Promise<any>
  listFiles(groupId: number): Promise<any[]>
  uploadFile(groupId: number, filePath: string): Promise<any>
  downloadFile(groupId: number, messageId: number, filePath: string): Promise<void>
  downloadFileWithProgress(groupId: number, messageId: number, destPath: string, onProgress: (p: number) => void): Promise<string>
  deleteFile(groupId: number, messageId: number): Promise<void>
  forwardFile(fromGroupId: number, toGroupId: number, messageId: number): Promise<void>
}
```

- [ ] **Verify existing tests pass**

Run: `npx vitest run`
Expected: PASS (80+ tests)

- [ ] **Commit**

```bash
git add -A && git commit -m "feat: add download IPC with progress events"
```

---

### Task 3: CircularProgress component

**Files:**
- Create: `src/components/CircularProgress.tsx`
- Create: `tests/unit/components/CircularProgress.test.tsx`

- [ ] **Write tests**

Create `tests/unit/components/CircularProgress.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CircularProgress from '../../../src/components/CircularProgress'

describe('CircularProgress', () => {
  it('should render SVG element', () => {
    const { container } = render(<CircularProgress size={60} progress={0.5} />)
    expect(container.querySelector('svg')).toBeDefined()
  })

  it('should display progress percentage', () => {
    render(<CircularProgress size={60} progress={0.5} />)
    expect(screen.getByText('50%')).toBeDefined()
  })

  it('should display 0% for zero progress', () => {
    render(<CircularProgress size={60} progress={0} />)
    expect(screen.getByText('0%')).toBeDefined()
  })

  it('should display 100% for complete progress', () => {
    render(<CircularProgress size={60} progress={1} />)
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('should have correct SVG viewBox', () => {
    const { container } = render(<CircularProgress size={60} progress={0.3} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 60 60')
  })

  it('should accept custom strokeWidth', () => {
    const { container } = render(<CircularProgress size={60} progress={0.5} strokeWidth={5} />)
    const circles = container.querySelectorAll('circle')
    circles.forEach(c => {
      expect(c.getAttribute('stroke-width')).toBe('5')
    })
  })
})
```

- [ ] **Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/CircularProgress.test.tsx --reporter=verbose`
Expected: FAIL — module not found

- [ ] **Implement CircularProgress component**

Create `src/components/CircularProgress.tsx`:

```typescript
interface CircularProgressProps {
  size: number
  progress: number
  strokeWidth?: number
}

export default function CircularProgress({ size, progress, strokeWidth = 4 }: CircularProgressProps) {
  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 0.15s ease' }}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.22}
        fontWeight="bold"
      >
        {Math.round(progress * 100)}%
      </text>
    </svg>
  )
}
```

- [ ] **Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/CircularProgress.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Commit**

```bash
git add -A && git commit -m "feat: add CircularProgress SVG component"
```

---

### Task 4: Update FileGrid with thumbnails, download, and progress

**Files:**
- Modify: `src/components/FileGrid.tsx`
- Modify: `tests/unit/components/FileGrid.test.tsx`

- [ ] **Update tests**

Replace content of `tests/unit/components/FileGrid.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FileGrid from '../../../src/components/FileGrid'
import { TelegramFile } from '../../../src/types'

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date() as any, groupId: 123, thumbnail: 'data:image/jpeg;base64,/9j/4AAQ==' },
  { id: 2, messageId: 2, name: 'video.mp4', size: 1048576, mimeType: 'video/mp4', date: new Date() as any, groupId: 123, thumbnail: 'data:image/jpeg;base64,/9j/4AAQ==' },
  { id: 3, messageId: 3, name: 'foto2.png', size: 4096, mimeType: 'image/png', date: new Date() as any, groupId: 123 },
  { id: 4, messageId: 4, name: 'doc.pdf', size: 204800, mimeType: 'application/pdf', date: new Date() as any, groupId: 123 },
]

describe('FileGrid', () => {
  it('should render media files with thumbnails', () => {
    render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
    expect(screen.getByText('video.mp4')).toBeDefined()
    expect(screen.getByText('foto2.png')).toBeDefined()
  })

  it('should show img tag when file has thumbnail', () => {
    const { container } = render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBe(2) // fotito.jpg and video.mp4 have thumbnails
  })

  it('should show gradient fallback when no thumbnail', () => {
    const { container } = render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    const items = container.querySelectorAll('[style*="linear-gradient"]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('should call onDownload when clicking an item', async () => {
    const onDownload = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    render(<FileGrid files={[mockFiles[0]]} onDownload={onDownload} />)
    fireEvent.click(screen.getByText('foto.jpg'))
    await waitFor(() => {
      expect(onDownload).toHaveBeenCalledWith(mockFiles[0], expect.any(Function))
    })
  })

  it('should show video badge for video files', () => {
    render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    expect(screen.getByText('▶️')).toBeDefined()
  })

  it('should show progress overlay during download', async () => {
    const onDownload = vi.fn(() => new Promise<string>(() => {})) // never resolves
    render(<FileGrid files={[mockFiles[0]]} onDownload={onDownload} />)
    fireEvent.click(screen.getByText('foto.jpg'))
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeDefined()
    })
  })

  it('should not show non-media files', () => {
    render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    expect(screen.queryByText('doc.pdf')).toBeNull()
  })

  it('should show empty state', () => {
    render(<FileGrid files={[]} onDownload={vi.fn()} />)
    expect(screen.getByText(/sin archivos multimedia/i)).toBeDefined()
  })
})
```

- [ ] **Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/FileGrid.test.tsx --reporter=verbose`
Expected: FAIL — type errors (onDownload prop not in interface yet)

- [ ] **Rewrite FileGrid component**

Replace `src/components/FileGrid.tsx`:

```typescript
import { useState, useCallback, useRef } from 'react'
import { TelegramFile } from '../types'
import { isMedia } from '../utils/fileTypes'
import CircularProgress from './CircularProgress'

interface DownloadState {
  status: 'idle' | 'downloading' | 'done'
  progress: number
  localPath?: string
}

interface FileGridProps {
  files: TelegramFile[]
  onDownload: (file: TelegramFile, onProgress: (p: number) => void) => Promise<string>
  onPreview?: (file: TelegramFile) => void
}

const GRADIENT_MAP: Record<string, [string, string]> = {
  'image/jpeg': ['#667eea', '#764ba2'],
  'image/png': ['#f093fb', '#f5576c'],
  'image/gif': ['#4facfe', '#00f2fe'],
  'image/webp': ['#43e97b', '#38f9d7'],
  'video/mp4': ['#a18cd1', '#fbc2eb'],
  'video/avi': ['#fa709a', '#fee140'],
  'video/mkv': ['#30cfd0', '#330867'],
  'video/webm': ['#a8edea', '#fed6e3'],
}

function getGradient(mimeType: string, index: number): string {
  return GRADIENT_MAP[mimeType]?.[index] ?? (index === 0 ? '#667eea' : '#764ba2')
}

export default function FileGrid({ files, onDownload, onPreview }: FileGridProps) {
  const mediaFiles = files.filter(f => isMedia(f.mimeType))
  const [downloadStates, setDownloadStates] = useState<Record<number, DownloadState>>({})
  const downloadStatesRef = useRef<Record<number, DownloadState>>({})

  const handleClick = async (file: TelegramFile) => {
    if (downloadStatesRef.current[file.id]?.status === 'downloading') return

    downloadStatesRef.current[file.id] = { status: 'downloading', progress: 0 }
    setDownloadStates({ ...downloadStatesRef.current })

    try {
      const localPath = await onDownload(file, (progress) => {
        downloadStatesRef.current[file.id] = { status: 'downloading', progress }
        setDownloadStates({ ...downloadStatesRef.current })
      })

      downloadStatesRef.current[file.id] = { status: 'done', progress: 1, localPath }
      setDownloadStates({ ...downloadStatesRef.current })

      if (onPreview) onPreview(file)
    } catch {
      downloadStatesRef.current[file.id] = { status: 'idle', progress: 0 }
      setDownloadStates({ ...downloadStatesRef.current })
    }
  }

  if (mediaFiles.length === 0) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#888', fontSize: 14 }}>Sin archivos multimedia</div>
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: 8, padding: 12
    }}>
      {mediaFiles.map(f => {
        const state = downloadStates[f.id]
        const isDownloading = state?.status === 'downloading'
        const isDone = state?.status === 'done'

        return (
          <div
            key={f.id}
            onClick={() => handleClick(f)}
            style={{
              aspectRatio: '1', borderRadius: 8, cursor: 'pointer',
              background: f.thumbnail
                ? '#1a1a2e'
                : `linear-gradient(135deg, ${getGradient(f.mimeType, 0)}, ${getGradient(f.mimeType, 1)})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', padding: 8, position: 'relative',
              overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {f.thumbnail && (
              <img
                src={f.thumbnail}
                alt=""
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', opacity: isDone ? 0.3 : 1
                }}
              />
            )}
            {f.mimeType.startsWith('video/') && !isDownloading && (
              <div style={{
                position: 'absolute', bottom: 6, right: 6,
                background: 'rgba(0,0,0,0.6)', color: 'white',
                fontSize: 11, padding: '2px 6px', borderRadius: 4
              }}>
                ▶️
              </div>
            )}
            {isDownloading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', zIndex: 2
              }}>
                <CircularProgress size={60} progress={state!.progress} />
              </div>
            )}
            <div style={{
              fontSize: 12, fontWeight: 500, textAlign: 'center',
              wordBreak: 'break-all', textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              position: 'relative', zIndex: 1
            }}>
              {f.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/FileGrid.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Run all tests to verify nothing broke**

Run: `npx vitest run`
Expected: PASS

- [ ] **Commit**

```bash
git add -A && git commit -m "feat: update FileGrid with thumbnails, download, and progress overlay"
```

---

### Task 5: Update PreviewModal

**Files:**
- Modify: `src/components/PreviewModal.tsx`
- Modify: `tests/unit/components/PreviewModal.test.tsx`

- [ ] **Update PreviewModal tests**

Replace `tests/unit/components/PreviewModal.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PreviewModal from '../../../src/components/PreviewModal'
import { TelegramFile } from '../../../src/types'

const imageFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date() as any, groupId: 123
}

describe('PreviewModal', () => {
  it('should render file info', () => {
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
  })

  it('should render image when localPath is provided', () => {
    const { container } = render(
      <PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} localPath="/tmp/foto.jpg" />
    )
    const img = container.querySelector('img')
    expect(img).toBeDefined()
    expect(img?.getAttribute('src')).toBe('/tmp/foto.jpg')
  })

  it('should render emoji fallback when no localPath', () => {
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('🖼️')).toBeDefined()
  })

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<PreviewModal file={imageFile} onClose={onClose} onDownload={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onDownload when download button clicked', () => {
    const onDownload = vi.fn()
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={onDownload} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByText('⬇️'))
    expect(onDownload).toHaveBeenCalledWith(imageFile)
  })

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('🗑️'))
    expect(onDelete).toHaveBeenCalledWith(imageFile)
  })
})
```

- [ ] **Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/PreviewModal.test.tsx --reporter=verbose`
Expected: FAIL — `localPath` prop not accepted yet

- [ ] **Update PreviewModal component**

Replace `src/components/PreviewModal.tsx`:

```typescript
import { TelegramFile } from '../types'
import { formatFileSize, formatDate } from '../utils/format'

interface PreviewModalProps {
  file: TelegramFile
  onClose: () => void
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  onForward?: (file: TelegramFile) => void
  readonly?: boolean
  localPath?: string
}

export default function PreviewModal({ file, onClose, onDownload, onDelete, onForward, readonly, localPath }: PreviewModalProps) {
  const isVideo = file.mimeType.startsWith('video/')
  const isImage = file.mimeType.startsWith('image/')

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 1 }}>
        {onForward && (
          <button onClick={() => onForward(file)} title="Reenviar"
            style={btnStyle}>↗️</button>
        )}
        {!readonly && (
          <button onClick={() => onDelete(file)} title="Eliminar"
            style={btnStyle}>🗑️</button>
        )}
        <button onClick={() => onDownload(file)} title="Descargar"
          style={btnStyle}>⬇️</button>
        <button onClick={onClose} title="Cerrar"
          style={{ ...btnStyle, fontSize: 20 }}>✕</button>
      </div>

      <div style={{
        background: '#1a1a2e', borderRadius: 12, padding: 24,
        maxWidth: '70vw', maxHeight: '60vh', minWidth: 300,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }}>
        {localPath && isImage ? (
          <img
            src={localPath}
            alt={file.name}
            style={{
              maxWidth: '100%', maxHeight: '100%',
              borderRadius: 8, objectFit: 'contain'
            }}
          />
        ) : localPath && isVideo ? (
          <video
            src={localPath}
            controls
            style={{
              maxWidth: '100%', maxHeight: '100%',
              borderRadius: 8
            }}
          />
        ) : (
          <>
            <div style={{ fontSize: 72, marginBottom: 16 }}>
              {isVideo ? '🎬' : '🖼️'}
            </div>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 600, marginBottom: 8, textAlign: 'center', wordBreak: 'break-all' }}>
              {file.name}
            </div>
            <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>
              {formatFileSize(file.size)} · {file.mimeType} · {formatDate(new Date(file.date))}
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, color: '#888', fontSize: 13 }}>
        <span style={{ cursor: 'pointer' }}>‹ Anterior</span>
        <span>|</span>
        <span style={{ cursor: 'pointer' }}>Siguiente ›</span>
        <span>|</span>
        <span style={{ cursor: 'pointer' }}>🔍 Zoom</span>
        <span>|</span>
        <span style={{ cursor: 'pointer' }}>↕ Ajustar</span>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
  borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 16,
  backdropFilter: 'blur(4px)'
}
```

- [ ] **Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/PreviewModal.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Run all tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Commit**

```bash
git add -A && git commit -m "feat: update PreviewModal to show actual images from localPath"
```

---

### Task 6: Wire GroupFilesPage

**Files:**
- Modify: `src/pages/GroupFilesPage.tsx`

- [ ] **Update GroupFilesPage** to use `downloadFileWithProgress`, save files to downloads dir, and pass `localPath` to PreviewModal

Replace `src/pages/GroupFilesPage.tsx` with:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { TelegramGroup, TelegramFile, ViewMode, FileFilter } from '../types'
import Toolbar from '../components/Toolbar'
import FileList from '../components/FileList'
import FileGrid from '../components/FileGrid'
import PreviewModal from '../components/PreviewModal'
import UploadDialog from '../components/UploadDialog'
import { isMedia, isDocument } from '../utils/fileTypes'

interface GroupFilesPageProps {
  group: TelegramGroup
  onBack: () => void
}

export default function GroupFilesPage({ group, onBack }: GroupFilesPageProps) {
  const [files, setFiles] = useState<TelegramFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FileFilter>('all')
  const [previewFile, setPreviewFile] = useState<TelegramFile | null>(null)
  const [previewLocalPath, setPreviewLocalPath] = useState<string | undefined>(undefined)
  const [showUpload, setShowUpload] = useState(false)

  const loadFiles = async () => {
    setLoading(true)
    try {
      const result = await window.telegramAPI.listFiles(group.id)
      setFiles(result)
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFiles() }, [group.id])

  const filteredFiles = files.filter(f => {
    if (filter === 'media') return isMedia(f.mimeType)
    if (filter === 'documents') return isDocument(f.mimeType)
    return true
  })

  const handleUpload = async (filePath: string) => {
    try {
      await window.telegramAPI.uploadFile(group.id, filePath)
      setShowUpload(false)
      loadFiles()
    } catch (err: any) {
      alert(err.message || 'Error al subir archivo')
    }
  }

  const handleDownload = async (file: TelegramFile) => {
    try {
      await window.telegramAPI.downloadFile(group.id, file.messageId, file.name)
    } catch (err: any) {
      alert(err.message || 'Error al descargar')
    }
  }

  const handleGridDownload = useCallback(async (file: TelegramFile, onProgress: (p: number) => void): Promise<string> => {
    const destPath = `downloads/${file.messageId}_${file.name}`
    const localPath = await window.telegramAPI.downloadFileWithProgress(
      group.id, file.messageId, destPath, onProgress
    )
    return localPath
  }, [group.id])

  const handleDelete = async (file: TelegramFile) => {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return
    try {
      await window.telegramAPI.deleteFile(group.id, file.messageId)
      setPreviewFile(null)
      setPreviewLocalPath(undefined)
      loadFiles()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar')
    }
  }

  const handleForward = async (file: TelegramFile) => {
    const targetId = prompt('ID del grupo destino:')
    if (!targetId) return
    try {
      await window.telegramAPI.forwardFile(group.id, Number(targetId), file.messageId)
      alert('Archivo reenviado')
    } catch (err: any) {
      alert(err.message || 'Error al reenviar')
    }
  }

  const handlePreviewOpen = (file: TelegramFile) => {
    setPreviewFile(file)
    setPreviewLocalPath(undefined)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 16px', borderBottom: '1px solid #ddd',
        display: 'flex', alignItems: 'center', gap: 8, background: '#fff'
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}>⬅️</button>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>{group.title}</span>
        {!group.isOwner && <span style={{ fontSize: 11, color: '#FF9800' }}>(Solo lectura)</span>}
      </div>

      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        onUpload={() => setShowUpload(true)}
        readonly={!group.isOwner}
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>Cargando archivos...</div>
        ) : viewMode === 'list' ? (
          <FileList files={filteredFiles} onDownload={handleDownload} onDelete={handleDelete} readonly={!group.isOwner} />
        ) : (
          <FileGrid files={filteredFiles} onDownload={handleGridDownload} onPreview={handlePreviewOpen} />
        )}
      </div>

      {previewFile && (
        <PreviewModal
          file={previewFile}
          localPath={previewLocalPath}
          onClose={() => { setPreviewFile(null); setPreviewLocalPath(undefined) }}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onForward={handleForward}
          readonly={!group.isOwner}
        />
      )}

      {showUpload && (
        <UploadDialog
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Run all tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Commit**

```bash
git add -A && git commit -m "feat: wire GroupFilesPage with download progress and local preview"
```

---

### Task 7: Final Verification

- [ ] **Run all tests**

Run: `npx vitest run`
Expected: 80+ tests PASS

- [ ] **Type check**

Run: `npx tsc --noEmit -p tsconfig.node.json`
Expected: PASS

Run: `npx tsc --noEmit -p tsconfig.web.json`
Expected: PASS (pre-existing electron-in-web errors may still show)

- [ ] **Build**

Run: `npm run build`
Expected: PASS

- [ ] **Final commit if any fixes needed**

```bash
git add -A && git commit -m "chore: final adjustments after verification"
```
