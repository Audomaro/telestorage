import { useState, useEffect } from 'react'
import { TelegramGroup, TelegramFile, ViewMode, FileFilter } from '../types'
import Toolbar from '../components/Toolbar'
import FileList from '../components/FileList'
import FileGrid from '../components/FileGrid'
import PreviewModal from '../components/PreviewModal'
import UploadDialog from '../components/UploadDialog'
import { isMedia, isDocument } from '../utils/fileTypes'

interface GroupFilesPageProps {
  group: TelegramGroup
  onBack: () => void
}

export default function GroupFilesPage({ group, onBack }: GroupFilesPageProps) {
  const [files, setFiles] = useState<TelegramFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FileFilter>('all')
  const [previewFile, setPreviewFile] = useState<TelegramFile | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const loadFiles = async () => {
    setLoading(true)
    try {
      const result = await window.telegramAPI.listFiles(group.id)
      setFiles(result)
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFiles() }, [group.id])

  const filteredFiles = files.filter(f => {
    if (filter === 'media') return isMedia(f.mimeType)
    if (filter === 'documents') return isDocument(f.mimeType)
    return true
  })

  const handleUpload = async (filePath: string) => {
    try {
      await window.telegramAPI.uploadFile(group.id, filePath)
      setShowUpload(false)
      loadFiles()
    } catch (err: any) {
      alert(err.message || 'Error al subir archivo')
    }
  }

  const handleDownload = async (file: TelegramFile) => {
    try {
      await window.telegramAPI.downloadFile(group.id, file.messageId, file.name)
    } catch (err: any) {
      alert(err.message || 'Error al descargar')
    }
  }

  const handleDelete = async (file: TelegramFile) => {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return
    try {
      await window.telegramAPI.deleteFile(group.id, file.messageId)
      setPreviewFile(null)
      loadFiles()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar')
    }
  }

  const handleForward = async (file: TelegramFile) => {
    const targetId = prompt('ID del grupo destino:')
    if (!targetId) return
    try {
      await window.telegramAPI.forwardFile(group.id, Number(targetId), file.messageId)
      alert('Archivo reenviado')
    } catch (err: any) {
      alert(err.message || 'Error al reenviar')
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 16px', borderBottom: '1px solid #ddd',
        display: 'flex', alignItems: 'center', gap: 8, background: '#fff'
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}>⬅️</button>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>{group.title}</span>
        {!group.isOwner && <span style={{ fontSize: 11, color: '#FF9800' }}>(Solo lectura)</span>}
      </div>

      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        onUpload={() => setShowUpload(true)}
        readonly={!group.isOwner}
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>Cargando archivos...</div>
        ) : viewMode === 'list' ? (
          <FileList files={filteredFiles} onDownload={handleDownload} onDelete={handleDelete} readonly={!group.isOwner} />
        ) : (
          <FileGrid files={filteredFiles} onPreview={setPreviewFile} />
        )}
      </div>

      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onForward={handleForward}
          readonly={!group.isOwner}
        />
      )}

      {showUpload && (
        <UploadDialog
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
