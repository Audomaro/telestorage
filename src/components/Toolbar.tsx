import { ViewMode, FileFilter } from '../types'
import styles from './Toolbar.module.css'

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
    <div className={styles.bar}>
      <div className={styles.group}>
        <button
          onClick={() => onViewModeChange('list')}
          className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
        >📋 Lista</button>
        <button
          onClick={() => onViewModeChange('gallery')}
          className={`${styles.viewBtn} ${viewMode === 'gallery' ? styles.viewBtnActive : ''}`}
        >🖼️ Galería</button>
      </div>

      <div className={styles.group}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`${styles.filterBtn} ${filter === f.value ? styles.filterBtnActive : ''}`}
          >{f.label}</button>
        ))}
      </div>

      {!readonly && (
        <button onClick={onUpload} className={styles.uploadBtn}>+ Subir</button>
      )}
    </div>
  )
}
