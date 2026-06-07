import { TelegramGroup } from '../types'
import { formatFileSize } from '../utils/format'

interface GroupListItemProps {
  group: TelegramGroup
  onClick: (group: TelegramGroup) => void
}

export default function GroupListItem({ group, onClick }: GroupListItemProps) {
  const initials = group.title.charAt(0).toUpperCase()
  const bgColor = group.isOwner ? '#4CAF50' : '#FF9800'

  return (
    <div
      onClick={() => onClick(group)}
      style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        cursor: 'pointer', opacity: group.isArchived ? 0.5 : 1,
        borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { if (!group.isArchived) (e.currentTarget.style.background = '#f9f9f9') }}
      onMouseLeave={(e) => { (e.currentTarget.style.background = 'transparent') }}
    >
      <div style={{
        background: bgColor, color: 'white', borderRadius: '50%',
        width: 42, height: 42, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginRight: 12, fontWeight: 'bold', fontSize: 16,
        flexShrink: 0
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: '#333', marginBottom: 2 }}>
          {group.title}
          <span style={{
            background: bgColor, color: 'white', fontSize: 10,
            padding: '1px 6px', borderRadius: 4, marginLeft: 8,
            verticalAlign: 'middle'
          }}>
            {group.isOwner ? 'Propio' : 'Tercero'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          {group.fileCount != null ? `${group.fileCount} archivos` : ''}
          {group.fileCount != null && group.totalSize ? ` · ${formatFileSize(group.totalSize)}` : ''}
          {!group.isOwner && ' · Solo lectura'}
          {group.isArchived && ' · Archivado'}
        </div>
      </div>
    </div>
  )
}
