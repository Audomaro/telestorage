# Gallery Preview Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop downloading full original files in the gallery grid; use Telegram's inline thumbnails instead and download originals on-demand only in the preview modal.

**Architecture:** FileGrid shows `f.thumbnail` (base64 data URL from Telegram API) directly — no download needed. When user clicks a card, PreviewModal opens and starts downloading the original file, showing loading progress. Prev/next navigation triggers re-download of the new file's original.

**Tech Stack:** React 18, TypeScript, CSS Modules, GramJS (Telegram API), Electron IPC

---

### Task 1: Simplify FileGrid — remove auto-download, show inline thumbs only

**Files:**
- Modify: `src/components/FileGrid.tsx`

- [ ] **Step 1: Rewrite FileGrid to remove download logic**

Replace entire file content with:

```tsx
import { TelegramFile } from '../types'
import { isMedia } from '../utils/fileTypes'
import styles from './FileGrid.module.css'

interface FileGridProps {
  files: TelegramFile[]
  onPreview: (file: TelegramFile) => void
}

function getGradient(mimeType: string, index: number): string {
  const gradients: Record<string, [string, string]> = {
    'image/jpeg': ['#667eea', '#764ba2'],
    'image/png':  ['#f093fb', '#f5576c'],
    'image/gif':  ['#4facfe', '#00f2fe'],
    'video/mp4':  ['#43e97b', '#38f9d7'],
    'video/quicktime': ['#fa709a', '#fee140'],
    'video/x-matroska': ['#a18cd1', '#fbc2eb'],
  }
  const g = gradients[mimeType] || ['#667eea', '#764ba2']
  return g[index]
}

export default function FileGrid({ files, onPreview }: FileGridProps) {
  const mediaFiles = files.filter(f => isMedia(f.mimeType))

  if (mediaFiles.length === 0) {
    return <div className={styles.empty}>Sin archivos multimedia</div>
  }

  return (
    <div className={styles.grid}>
      {mediaFiles.map(f => (
        <div
          key={f.id}
          onClick={() => onPreview(f)}
          className={styles.card}
          style={{
            background: f.thumbnail
              ? '#0d0d1a'
              : `linear-gradient(135deg, ${getGradient(f.mimeType, 0)}, ${getGradient(f.mimeType, 1)})`
          }}
        >
          {f.thumbnail ? (
            f.mimeType.startsWith('video/') ? (
              <>
                <img src={f.thumbnail} alt="" className={styles.thumb} />
                <div className={styles.videoBadge}>▶️</div>
              </>
            ) : (
              <img src={f.thumbnail} alt="" className={styles.thumb} />
            )
          ) : null}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Run existing FileGrid tests**

```bash
npx vitest run tests/unit/components/FileGrid.test.tsx 2>&1
```

Expected: tests fail because `onDownload` prop was removed and rendering changed.

- [ ] **Step 3: Commit**

```bash
git add src/components/FileGrid.tsx
git commit -m "refactor(FileGrid): remove auto-download, show inline thumbs only"
```

---

### Task 2: Update FileGrid tests

**Files:**
- Modify: `tests/unit/components/FileGrid.test.tsx`

- [ ] **Step 1: Rewrite FileGrid tests**

Replace entire file with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileGrid from '../../../src/components/FileGrid'
import { TelegramFile } from '../../../src/types'

beforeEach(() => {
  window.alert = vi.fn()
})

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date() as any, groupId: 123, thumbnail: 'data:image/jpeg;base64,/9j/4AAQ==' },
  { id: 2, messageId: 2, name: 'video.mp4', size: 1048576, mimeType: 'video/mp4', date: new Date() as any, groupId: 123, thumbnail: 'data:image/jpeg;base64,/9j/4AAQ==' },
  { id: 3, messageId: 3, name: 'foto2.png', size: 4096, mimeType: 'image/png', date: new Date() as any, groupId: 123, thumbnail: null },
  { id: 4, messageId: 4, name: 'doc.pdf', size: 51200, mimeType: 'application/pdf', date: new Date() as any, groupId: 123, thumbnail: null },
]

describe('FileGrid', () => {
  it('should render 3 media items', () => {
    const { container } = render(<FileGrid files={mockFiles} onPreview={vi.fn()} />)
    const cards = container.querySelectorAll('[class*="card"]')
    expect(cards.length).toBe(3)
  })

  it('should render img when file has thumbnail', () => {
    const { container } = render(<FileGrid files={[mockFiles[0]]} onPreview={vi.fn()} />)
    const img = container.querySelector('img')
    expect(img).toBeDefined()
    expect(img!.getAttribute('src')).toBe(mockFiles[0].thumbnail)
  })

  it('should show video badge for video files', () => {
    render(<FileGrid files={[mockFiles[1]]} onPreview={vi.fn()} />)
    expect(screen.getByText('▶️')).toBeDefined()
  })

  it('should call onPreview when clicking a card', () => {
    const onPreview = vi.fn()
    const { container } = render(<FileGrid files={[mockFiles[0]]} onPreview={onPreview} />)
    const card = container.querySelector('[class*="card"]')!
    fireEvent.click(card)
    expect(onPreview).toHaveBeenCalledWith(mockFiles[0])
  })

  it('should not show non-media files', () => {
    const { container } = render(<FileGrid files={mockFiles} onPreview={vi.fn()} />)
    const cards = container.querySelectorAll('[class*="card"]')
    expect(cards.length).toBe(3)
  })

  it('should show empty state when no media files', () => {
    render(<FileGrid files={[mockFiles[3]]} onPreview={vi.fn()} />)
    expect(screen.getByText(/sin archivos multimedia/i)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify**

```bash
npx vitest run tests/unit/components/FileGrid.test.tsx 2>&1
```

Expected: 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/components/FileGrid.test.tsx
git commit -m "test(FileGrid): simplify tests for inline-thumbnail-only mode"
```

---

### Task 3: Update PreviewModal — download original on open, loading state

**Files:**
- Modify: `src/components/PreviewModal.tsx`
- Modify: `src/components/PreviewModal.module.css`

- [ ] **Step 1: Add loading state CSS**

Add to `PreviewModal.module.css`:

```css
.loadingOverlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #aaa;
  gap: 12px;
}

.loadingText {
  font-size: 13px;
  color: #aaa;
}

.errorText {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  padding: 24px;
}
```

- [ ] **Step 2: Rewrite PreviewModal with internal download management**

Replace `src/components/PreviewModal.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { TelegramFile } from '../types'
import { formatFileSize, formatDate } from '../utils/format'
import CircularProgress from './CircularProgress'
import styles from './PreviewModal.module.css'

interface PreviewModalProps {
  file: TelegramFile
  groupId: number
  onClose: () => void
  onDownload: (file: TelegramFile) => void
  onSaveToDisk?: (file: TelegramFile, onProgress: (p: number) => void) => Promise<void>
  onDelete: (file: TelegramFile) => void
  onForward?: (file: TelegramFile) => void
  readonly?: boolean
  hasPrevious?: boolean
  hasNext?: boolean
  onPrevious?: () => void
  onNext?: () => void
  onLoadOriginal: (file: TelegramFile, onProgress: (p: number) => void) => Promise<string>
}

export default function PreviewModal({ file, groupId, onClose, onDownload, onSaveToDisk, onDelete, onForward, readonly, hasPrevious, hasNext, onPrevious, onNext, onLoadOriginal }: PreviewModalProps) {
  const isVideo = file.mimeType.startsWith('video/')
  const isImage = file.mimeType.startsWith('image/')
  const [saving, setSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)
  const [localPath, setLocalPath] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLocalPath(undefined)
    setLoading(true)
    setLoadProgress(0)
    setError(null)

    onLoadOriginal(file, (p) => {
      if (!cancelled) setLoadProgress(p)
    }).then((path) => {
      if (!cancelled) {
        setLocalPath(path)
        setLoading(false)
      }
    }).catch((err: any) => {
      if (!cancelled) {
        setError(err.message || 'Error al cargar original')
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [file.id, groupId])

  const handleSave = async () => {
    if (!onSaveToDisk) {
      onDownload(file)
      return
    }
    setSaving(true)
    setSaveProgress(0)
    try {
      await onSaveToDisk(file, setSaveProgress)
      alert('Archivo guardado en la carpeta de descargas')
    } catch {
      alert('Error al guardar el archivo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.toolbar}>
        {onForward && (
          <button onClick={() => onForward(file)} title="Reenviar" className={styles.toolbarBtn}>↗️</button>
        )}
        {!readonly && (
          <button onClick={() => onDelete(file)} title="Eliminar" className={styles.toolbarBtn}>🗑️</button>
        )}
        <button onClick={handleSave} title="Guardar en disco" className={styles.toolbarBtn}>
          {saving ? `${Math.round(saveProgress * 100)}%` : '⬇️'}
        </button>
        <button onClick={onClose} title="Cerrar" className={`${styles.toolbarBtn} ${styles.toolbarBtnClose}`}>✕</button>
      </div>

      <div className={styles.content}>
        {hasPrevious && (
          <button onClick={onPrevious} className={styles.navArrow} style={{ left: 8 }}>‹</button>
        )}
        {hasNext && (
          <button onClick={onNext} className={styles.navArrow} style={{ right: 8 }}>›</button>
        )}
        {loading ? (
          <div className={styles.loadingOverlay}>
            <CircularProgress size={60} progress={loadProgress} />
            <span className={styles.loadingText}>Cargando... {Math.round(loadProgress * 100)}%</span>
          </div>
        ) : error ? (
          <div className={styles.errorText}>{error}</div>
        ) : localPath && isImage ? (
          <img src={localPath} alt={file.name} className={styles.media} />
        ) : localPath && isVideo ? (
          <video src={localPath} controls autoPlay className={styles.mediaVideo} />
        ) : (
          <>
            <div className={styles.emoji}>{isVideo ? '🎬' : '🖼️'}</div>
            <div className={styles.fileName}>{file.name}</div>
            <div className={styles.fileMeta}>
              {formatFileSize(file.size)} · {file.mimeType} · {formatDate(new Date(file.date))}
            </div>
          </>
        )}
      </div>

      {saving && (
        <div className={styles.progressBar}>
          <CircularProgress size={40} progress={saveProgress} />
          <span className={styles.progressText}>Guardando...</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run existing PreviewModal tests**

```bash
npx vitest run --reporter=verbose 2>&1 | grep PreviewModal
```

If tests fail, update them to match new props.

- [ ] **Step 4: Commit**

```bash
git add src/components/PreviewModal.tsx src/components/PreviewModal.module.css
git commit -m "feat(PreviewModal): download original on open with loading state"
```

---

### Task 4: Update GroupFilesPage — remove previewLocalPath state, wire new props

**Files:**
- Modify: `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Remove previewLocalPath state and simplify handlers**

Replace the relevant section (`handleGridPreview`, `handlePreviewOpen`, preview modal render) in `GroupFilesPage.tsx`:

Remove `previewLocalPath` state line:
```tsx
const [previewFile, setPreviewFile] = useState<TelegramFile | null>(null)
```

Update `handlePreviewOpen`:
```tsx
const handlePreviewOpen = (file: TelegramFile) => {
  setPreviewFile(file)
}
```

Update `handleGridPreview` signature — remove `onProgress` parameter default, keep as is (already returns `Promise<string>`).

Update PreviewModal render:
```tsx
{previewFile && (() => {
  const previewIndex = filteredFiles.findIndex(f => f.id === previewFile.id)
  const hasPrev = previewIndex > 0
  const hasNext = previewIndex < filteredFiles.length - 1
  const navigateTo = (index: number) => {
    if (index < 0 || index >= filteredFiles.length) return
    setPreviewFile(filteredFiles[index])
  }
  return (
    <PreviewModal
      file={previewFile}
      groupId={group.id}
      onClose={() => setPreviewFile(null)}
      onDownload={(f) => handleDownload(f)}
      onSaveToDisk={handleSaveToDisk}
      onDelete={handleDelete}
      onForward={handleForward}
      readonly={!group.isOwner}
      hasPrevious={hasPrev}
      hasNext={hasNext}
      onPrevious={() => navigateTo(previewIndex - 1)}
      onNext={() => navigateTo(previewIndex + 1)}
      onLoadOriginal={handleGridPreview}
    />
  )
})()}
```

Remove `handlePreviewOpen` second parameter:
```tsx
const handlePreviewOpen = (file: TelegramFile, localPath?: string) => {
```
→
```tsx
const handlePreviewOpen = (file: TelegramFile) => {
```

- [ ] **Step 2: Build to check for TypeScript errors**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors

- [ ] **Step 3: Run all tests**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: all tests PASS

- [ ] **Step 4: Build**

```bash
npx electron-vite build 2>&1
```

Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/pages/GroupFilesPage.tsx
git commit -m "feat(GroupFilesPage): wire PreviewModal with on-demand original loading"
```
