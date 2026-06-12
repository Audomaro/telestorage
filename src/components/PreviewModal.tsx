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
