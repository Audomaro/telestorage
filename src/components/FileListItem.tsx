import { TelegramFile } from '../types'
import { formatFileSize } from '../utils/format'
import { fileTypeLabel } from '../utils/fileTypes'
import styles from './FileListItem.module.css'

interface FileListItemProps {
  file: TelegramFile
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  readonly?: boolean
}

export default function FileListItem({ file, onDownload, onDelete, readonly }: FileListItemProps) {
  return (
    <div className={styles.row}>
      <span className={styles.icon}>{fileTypeLabel(file.mimeType)}</span>
      <span className={styles.name}>{file.name}</span>
      <span className={styles.size}>{formatFileSize(file.size)}</span>
      <span className={styles.date}>{new Date(file.date).toLocaleDateString()}</span>
      <span className={styles.actions}>
        <button onClick={() => onDownload(file)} className={styles.actionBtn} title="Descargar">⬇️</button>
        {!readonly && (
          <button onClick={() => onDelete(file)} className={styles.actionBtn} title="Eliminar">🗑️</button>
        )}
      </span>
    </div>
  )
}
