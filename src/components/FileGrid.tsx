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
