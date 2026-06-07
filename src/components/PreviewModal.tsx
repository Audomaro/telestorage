import { TelegramFile } from '../types'
import { formatFileSize, formatDate } from '../utils/format'

interface PreviewModalProps {
  file: TelegramFile
  onClose: () => void
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  onForward?: (file: TelegramFile) => void
  readonly?: boolean
}

export default function PreviewModal({ file, onClose, onDownload, onDelete, onForward, readonly }: PreviewModalProps) {
  const isVideo = file.mimeType.startsWith('video/')

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 1 }}>
        {onForward && (
          <button onClick={() => onForward(file)} title="Reenviar"
            style={btnStyle}>↗️</button>
        )}
        {!readonly && (
          <button onClick={() => onDelete(file)} title="Eliminar"
            style={btnStyle}>🗑️</button>
        )}
        <button onClick={() => onDownload(file)} title="Descargar"
          style={btnStyle}>⬇️</button>
        <button onClick={onClose} title="Cerrar"
          style={{ ...btnStyle, fontSize: 20 }}>✕</button>
      </div>

      <div style={{
        background: '#1a1a2e', borderRadius: 12, padding: 24,
        maxWidth: '70vw', maxHeight: '60vh', minWidth: 300,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>
          {isVideo ? '🎬' : '🖼️'}
        </div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 600, marginBottom: 8, textAlign: 'center', wordBreak: 'break-all' }}>
          {file.name}
        </div>
        <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>
          {formatFileSize(file.size)} · {file.mimeType} · {formatDate(new Date(file.date))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, color: '#888', fontSize: 13 }}>
        <span style={{ cursor: 'pointer' }}>‹ Anterior</span>
        <span>|</span>
        <span style={{ cursor: 'pointer' }}>Siguiente ›</span>
        <span>|</span>
        <span style={{ cursor: 'pointer' }}>🔍 Zoom</span>
        <span>|</span>
        <span style={{ cursor: 'pointer' }}>↕ Ajustar</span>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
  borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 16,
  backdropFilter: 'blur(4px)'
}
