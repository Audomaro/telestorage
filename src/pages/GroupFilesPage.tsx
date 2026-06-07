import { useState, useEffect } from 'react'
import { TelegramGroup, TelegramFile } from '../types'
import FileList from '../components/FileList'

interface GroupFilesPageProps {
  group: TelegramGroup
  onBack: () => void
}

export default function GroupFilesPage({ group, onBack }: GroupFilesPageProps) {
  const [files, setFiles] = useState<TelegramFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFiles = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await window.telegramAPI.listFiles(group.id)
      setFiles(result)
    } catch (err: any) {
      setError(err.message || 'Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFiles() }, [group.id])

  const handleDownload = async (file: TelegramFile) => {
    try {
      await window.telegramAPI.downloadFile(group.id, file.messageId, file.name)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (file: TelegramFile) => {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return
    try {
      await window.telegramAPI.deleteFile(group.id, file.messageId)
      loadFiles()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 8, background: '#fff' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}>⬅️</button>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>{group.title}</span>
        {!group.isOwner && <span style={{ fontSize: 11, color: '#FF9800', marginLeft: 4 }}>(Solo lectura)</span>}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>Cargando archivos...</div>
        ) : error ? (
          <div style={{ padding: 16, color: '#d32f2f', background: '#FFEBEE', fontSize: 14 }}>{error}</div>
        ) : (
          <FileList files={files} onDownload={handleDownload} onDelete={handleDelete} readonly={!group.isOwner} />
        )}
      </div>
    </div>
  )
}
