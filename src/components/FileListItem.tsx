import { TelegramFile } from '../types'
import { formatFileSize } from '../utils/format'
import { fileTypeLabel } from '../utils/fileTypes'

interface FileListItemProps {
  file: TelegramFile
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  readonly?: boolean
}

export default function FileListItem({ file, onDownload, onDelete, readonly }: FileListItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
      <span style={{ marginRight: 12, fontSize: 16, flexShrink: 0 }}>{fileTypeLabel(file.mimeType)}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>
        {file.name}
      </span>
      <span style={{ color: '#888', fontSize: 12, marginRight: 16, flexShrink: 0 }}>{formatFileSize(file.size)}</span>
      <span style={{ color: '#888', fontSize: 12, marginRight: 16, flexShrink: 0 }}>
        {new Date(file.date).toLocaleDateString()}
      </span>
      <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={() => onDownload(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }} title="Descargar">⬇️</button>
        {!readonly && (
          <button onClick={() => onDelete(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }} title="Eliminar">🗑️</button>
        )}
      </span>
    </div>
  )
}
