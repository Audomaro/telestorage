import { useState, DragEvent } from 'react'

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
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'white', borderRadius: 12, padding: 32,
        maxWidth: 400, width: '90%'
      }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, color: '#333' }}>Subir archivo</h3>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{
            border: `2px dashed ${dragging ? '#4CAF50' : '#ccc'}`,
            borderRadius: 8, padding: 40, textAlign: 'center',
            background: dragging ? '#E8F5E9' : '#fafafa',
            cursor: 'pointer', marginBottom: 16,
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 14, color: '#888' }}>
            Arrastra un archivo aquí o haz clic para seleccionar
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc',
            background: 'white', cursor: 'pointer', fontSize: 13, color: '#555'
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
