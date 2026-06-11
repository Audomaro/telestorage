import { useState, DragEvent } from 'react'
import { formatFileSize } from '../utils/format'
import styles from './UploadDialog.module.css'

interface FileEntry {
  path?: string
  name: string
  size: number
  data?: number[]
}

interface UploadDialogProps {
  groupId: number
  onUpload: () => void
  onClose: () => void
}

const MAX_DRAG_MEMORY = 100 * 1024 * 1024 // 100 MB

export default function UploadDialog({ groupId, onUpload, onClose }: UploadDialogProps) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [uploading, setUploading] = useState(false)

  const handleClick = async () => {
    try {
      const paths = await window.telegramAPI.pickFiles()
      if (paths.length > 0) {
        const entries: FileEntry[] = paths.map(p => ({
          path: p,
          name: p.split('\\').pop()?.split('/').pop() || p,
          size: 0
        }))
        setFiles(prev => [...prev, ...entries])
      }
    } catch {
      // user cancelled
    }
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)

    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const f = e.dataTransfer.files[i]
      const filePath = (f as any).path
      if (filePath) {
        setFiles(prev => [...prev, { path: filePath, name: f.name, size: f.size }])
      } else if (f.size > MAX_DRAG_MEMORY) {
        alert(`"${f.name}" es demasiado grande para arrastrar (máx. 100 MB)`)
      } else {
        const buf = await f.arrayBuffer()
        const data = Array.from(new Uint8Array(buf))
        setFiles(prev => [...prev, { name: f.name, size: f.size, data }])
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0 || uploading) return
    setUploading(true)

    const errors: string[] = []

    const clickFiles = files.filter(f => f.path).map(f => f.path!)
    if (clickFiles.length > 0) {
      const results = await window.telegramAPI.uploadMultipleFiles(groupId, clickFiles)
      for (const r of results) {
        if (r.error) errors.push(`${r.name}: ${r.error}`)
      }
    }

    for (const f of files) {
      if (!f.data) continue
      try {
        await window.telegramAPI.uploadTempFile(groupId, f.name, f.data)
      } catch (err: any) {
        errors.push(`${f.name}: ${err.message}`)
      }
    }

    if (errors.length > 0) {
      alert(`Errores al subir:\n${errors.join('\n')}`)
    }
    onUpload()
    setFiles([])
    setUploading(false)
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.dialog}>
        <h3 className={styles.heading}>
          {uploading
            ? 'Subiendo archivos...'
            : files.length > 0
              ? `${files.length} archivo${files.length !== 1 ? 's' : ''} seleccionado${files.length !== 1 ? 's' : ''}`
              : 'Subir archivos'}
        </h3>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={uploading ? undefined : handleClick}
          className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''} ${uploading ? styles.dropZoneDisabled : ''}`}
        >
          <div className={styles.dropIcon}>📁</div>
          <div className={styles.dropText}>
            Arrastra archivos aquí o haz clic para seleccionar
          </div>
        </div>

        {files.length > 0 && (
          <div className={styles.fileList}>
            {files.map((f, i) => (
              <div key={i} className={styles.fileRow}>
                <span className={styles.fileName}>{f.name}</span>
                {f.size > 0 && <span className={styles.fileSize}>{formatFileSize(f.size)}</span>}
                <button className={styles.removeBtn} disabled={uploading} onClick={() => removeFile(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <button onClick={onClose} disabled={uploading} className={styles.cancelBtn}>Cancelar</button>
          <button onClick={handleUpload} disabled={files.length === 0 || uploading} className={styles.uploadBtn}>
            {uploading ? 'Subiendo...' : `Subir ${files.length > 0 ? `${files.length} archivo${files.length !== 1 ? 's' : ''}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
