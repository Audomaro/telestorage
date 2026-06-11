import { TelegramGroup } from '../types'
import { formatFileSize } from '../utils/format'
import styles from './GroupListItem.module.css'

interface GroupListItemProps {
  group: TelegramGroup
  onClick: (group: TelegramGroup) => void
  onDelete?: (group: TelegramGroup) => void
}

export default function GroupListItem({ group, onClick, onDelete }: GroupListItemProps) {
  const initials = group.title.charAt(0).toUpperCase()
  const bgColor = group.isOwner ? '#4CAF50' : '#FF9800'

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(group)
  }

  return (
    <div
      onClick={() => onClick(group)}
      className={styles.item}
      style={{ opacity: group.isArchived ? 0.5 : 1 }}
    >
      <div
        className={styles.avatar}
        style={{ background: bgColor }}
      >
        {initials}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>
          {group.title}
          <span
            className={styles.badge}
            style={{ background: bgColor }}
          >
            {group.isOwner ? 'Propio' : 'Tercero'}
          </span>
        </div>
        <div className={styles.meta}>
          {group.fileCount != null ? `${group.fileCount} archivos` : ''}
          {group.fileCount != null && group.totalSize ? ` · ${formatFileSize(group.totalSize)}` : ''}
          {!group.isOwner && ' · Solo lectura'}
          {group.isArchived && ' · Archivado'}
        </div>
      </div>
      {group.isOwner && onDelete && (
        <button onClick={handleDelete} className={styles.deleteBtn} title="Eliminar grupo">🗑️</button>
      )}
    </div>
  )
}
