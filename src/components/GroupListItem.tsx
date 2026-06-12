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
          {group.totalSize ? formatFileSize(group.totalSize) : ''}
          {group.totalSize && !group.isOwner ? ' · ' : ''}
          {!group.isOwner && 'Solo lectura'}
          {group.isArchived && (group.totalSize || !group.isOwner ? ' · ' : '') + 'Archivado'}
        </div>
      </div>
      {group.isOwner && onDelete && (
        <button onClick={handleDelete} className={styles.deleteBtn} title="Eliminar grupo">🗑️</button>
      )}
    </div>
  )
}