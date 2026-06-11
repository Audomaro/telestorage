import { useState, useRef } from 'react'
import { TelegramFile } from '../types'
import { isMedia } from '../utils/fileTypes'
import CircularProgress from './CircularProgress'
import styles from './FileGrid.module.css'

interface DownloadState {
  status: 'idle' | 'downloading' | 'done'
  progress: number
  localPath?: string
}

interface FileGridProps {
  files: TelegramFile[]
  onDownload: (file: TelegramFile, onProgress: (p: number) => void) => Promise<string>
  onPreview?: (file: TelegramFile, localPath?: string) => void
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

      if (onPreview) onPreview(file, localPath)
    } catch {
      downloadStatesRef.current[file.id] = { status: 'idle', progress: 0 }
      setDownloadStates({ ...downloadStatesRef.current })
      alert('Error al descargar previsualización')
    }
  }

  if (mediaFiles.length === 0) {
    return <div className={styles.empty}>Sin archivos multimedia</div>
  }

  return (
    <div className={styles.grid}>
      {mediaFiles.map(f => {
        const state = downloadStates[f.id]
        const isDownloading = state?.status === 'downloading'

        return (
          <div
            key={f.id}
            onClick={() => handleClick(f)}
            className={styles.card}
            style={{
              background: f.thumbnail
                ? '#1a1a2e'
                : `linear-gradient(135deg, ${getGradient(f.mimeType, 0)}, ${getGradient(f.mimeType, 1)})`
            }}
          >
            {f.thumbnail && (
              <img src={f.thumbnail} alt="" className={styles.thumb} />
            )}
            {f.mimeType.startsWith('video/') && !isDownloading && (
              <div className={styles.videoBadge}>▶️</div>
            )}
            {isDownloading && (
              <div className={styles.progressOverlay}>
                <CircularProgress size={60} progress={state!.progress} />
              </div>
            )}
            <div className={styles.name}>{f.name}</div>
          </div>
        )
      })}
    </div>
  )
}
