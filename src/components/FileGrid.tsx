import { TelegramFile } from '../types'
import { isMedia } from '../utils/fileTypes'

interface FileGridProps {
  files: TelegramFile[]
  onPreview: (file: TelegramFile) => void
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

export default function FileGrid({ files, onPreview }: FileGridProps) {
  const mediaFiles = files.filter(f => isMedia(f.mimeType))

  if (mediaFiles.length === 0) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#888', fontSize: 14 }}>Sin archivos multimedia</div>
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: 8, padding: 12
    }}>
      {mediaFiles.map(f => (
        <div
          key={f.id}
          onClick={() => onPreview(f)}
          style={{
            aspectRatio: '1', borderRadius: 8, cursor: 'pointer',
            background: `linear-gradient(135deg, ${getGradient(f.mimeType, 0)}, ${getGradient(f.mimeType, 1)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', padding: 8, position: 'relative',
            overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {f.mimeType.startsWith('video/') && (
            <div style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'rgba(0,0,0,0.6)', color: 'white',
              fontSize: 11, padding: '2px 6px', borderRadius: 4
            }}>
              ▶️
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', wordBreak: 'break-all', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            {f.name}
          </div>
        </div>
      ))}
    </div>
  )
}
