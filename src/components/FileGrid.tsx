import { useState, useRef } from 'react'
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
                  objectFit: 'cover'
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
