import { useState, DragEvent } from 'react'
import styles from './UploadDialog.module.css'

interface UploadDialogProps {
  onUpload: (filePath: string) => void
  onClose: () => void
}

export default function UploadDialog({ onUpload, onClose }: UploadDialogProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload((file as any).path)
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = () => {
      if (input.files?.[0]) onUpload((input.files[0] as any).path)
    }
    input.click()
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.dialog}>
        <h3 className={styles.heading}>Subir archivo</h3>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={handleClick}
          className={styles.dropZone}
          style={{
            border: `2px dashed ${dragging ? '#4CAF50' : '#ccc'}`,
            background: dragging ? '#E8F5E9' : '#fafafa'
          }}
        >
          <div className={styles.dropIcon}>📁</div>
          <div className={styles.dropText}>
            Arrastra un archivo aquí o haz clic para seleccionar
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
