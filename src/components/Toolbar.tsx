import { ViewMode, FileFilter } from '../types'

interface ToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  filter: FileFilter
  onFilterChange: (filter: FileFilter) => void
  onUpload: () => void
  readonly?: boolean
}

const FILTERS: { label: string; value: FileFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Multimedia', value: 'media' },
  { label: 'Documentos', value: 'documents' },
]

export default function Toolbar({ viewMode, onViewModeChange, filter, onFilterChange, onUpload, readonly }: ToolbarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px', borderBottom: '1px solid #ddd', gap: 12, flexWrap: 'wrap',
      background: '#fafafa'
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onViewModeChange('list')}
          style={{
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
            background: viewMode === 'list' ? '#4CAF50' : 'transparent',
            color: viewMode === 'list' ? 'white' : '#555',
            border: viewMode === 'list' ? '1px solid #4CAF50' : '1px solid #ddd',
            fontWeight: viewMode === 'list' ? 600 : 400
          }}
        >📋 Lista</button>
        <button
          onClick={() => onViewModeChange('gallery')}
          style={{
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
            background: viewMode === 'gallery' ? '#4CAF50' : 'transparent',
            color: viewMode === 'gallery' ? 'white' : '#555',
            border: viewMode === 'gallery' ? '1px solid #4CAF50' : '1px solid #ddd',
            fontWeight: viewMode === 'gallery' ? 600 : 400
          }}
        >🖼️ Galería</button>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            style={{
              padding: '5px 12px', borderRadius: 12, cursor: 'pointer', fontSize: 12,
              background: filter === f.value ? '#E8F5E9' : 'transparent',
              color: filter === f.value ? '#2E7D32' : '#666',
              border: '1px solid', borderColor: filter === f.value ? '#4CAF50' : '#ddd',
              fontWeight: filter === f.value ? 600 : 400
            }}
          >{f.label}</button>
        ))}
      </div>

      {!readonly && (
        <button onClick={onUpload} style={{
          padding: '6px 16px', background: '#4CAF50', color: 'white', border: 'none',
          borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
        }}>+ Subir</button>
      )}
    </div>
  )
}
