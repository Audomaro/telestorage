import { useState, useEffect, useCallback } from 'react'
import { TelegramGroup, TelegramFile, ViewMode, FileFilter } from '../types'
import Toolbar from '../components/Toolbar'
import FileList from '../components/FileList'
import FileGrid from '../components/FileGrid'
import PreviewModal from '../components/PreviewModal'
import UploadDialog from '../components/UploadDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { isMedia, isDocument } from '../utils/fileTypes'
import { getExtension } from '../utils/format'
import styles from './GroupFilesPage.module.css'

interface GroupFilesPageProps {
  group: TelegramGroup
  onBack: () => void
  onSettings?: () => void
}

export default function GroupFilesPage({ group, onBack, onSettings }: GroupFilesPageProps) {
  const [files, setFiles] = useState<TelegramFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FileFilter>('all')
  const [previewFile, setPreviewFile] = useState<TelegramFile | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<TelegramFile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFiles = async () => {
    setLoading(true)
    setError(null)
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

  const filteredFiles = files.filter(f => {
    if (filter === 'media') return isMedia(f.mimeType)
    if (filter === 'documents') return isDocument(f.mimeType)
    return true
  })

  const handleDownload = async (file: TelegramFile, onProgress?: (p: number) => void) => {
    try {
      const settings = await window.telegramAPI.getSettings()
      const destPath = `${settings.downloadPath}\\${file.messageId}_${file.name}`
      if (onProgress) {
        await window.telegramAPI.downloadFileWithProgress(group.id, file.messageId, destPath, onProgress)
      } else {
        await window.telegramAPI.downloadFile(group.id, file.messageId, destPath)
      }
    } catch (err: any) {
      alert(err.message || 'Error al descargar')
    }
  }

  const handleGridPreview = useCallback(async (file: TelegramFile, onProgress: (p: number) => void): Promise<string> => {
    const ext = getExtension(file.mimeType)
    const localPath = await window.telegramAPI.downloadPreview(group.id, file.messageId, ext, onProgress)
    return `file:///${localPath.replace(/\\/g, '/')}`
  }, [group.id])

  const handleSaveToDisk = useCallback(async (file: TelegramFile, onProgress: (p: number) => void): Promise<void> => {
    const settings = await window.telegramAPI.getSettings()
    const destPath = `${settings.downloadPath}\\${file.messageId}_${file.name}`
    await window.telegramAPI.downloadFileWithProgress(group.id, file.messageId, destPath, onProgress)
  }, [group.id])

  const handlePreviewOpen = (file: TelegramFile) => {
    setPreviewFile(file)
  }

  const handleDelete = async (file: TelegramFile) => {
    setConfirmDeleteFile(file)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteFile) return
    setDeleting(true)
    try {
      await window.telegramAPI.deleteFile(group.id, confirmDeleteFile.messageId)
      setPreviewFile(null)
      setConfirmDeleteFile(null)
      loadFiles()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
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
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>⬅️</button>
        <span className={styles.groupTitle}>{group.title}</span>
        {!group.isOwner && <span className={styles.readonlyLabel}>(Solo lectura)</span>}
        <div className={styles.headerRight}>
          {onSettings && (
            <button onClick={onSettings} title="Configuración" className={styles.settingsBtn}>⚙️</button>
          )}
        </div>
      </div>

      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        onUpload={() => setShowUpload(true)}
        readonly={!group.isOwner}
      />

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading}>Cargando archivos...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : viewMode === 'list' ? (
          <FileList files={filteredFiles} onDownload={handleDownload} onDelete={handleDelete} readonly={!group.isOwner} />
        ) : (
          <FileGrid files={filteredFiles} groupId={group.id} onPreview={handlePreviewOpen} />
        )}
      </div>

      {previewFile && (() => {
        const previewIndex = filteredFiles.findIndex(f => f.id === previewFile.id)
        const hasPrev = previewIndex > 0
        const hasNext = previewIndex < filteredFiles.length - 1
        const navigateTo = (index: number) => {
          if (index < 0 || index >= filteredFiles.length) return
          setPreviewFile(filteredFiles[index])
        }
        return (
          <PreviewModal
            file={previewFile}
            groupId={group.id}
            onClose={() => setPreviewFile(null)}
            onDownload={(f) => handleDownload(f)}
            onSaveToDisk={handleSaveToDisk}
            onDelete={handleDelete}
            onForward={handleForward}
            readonly={!group.isOwner}
            hasPrevious={hasPrev}
            hasNext={hasNext}
            onPrevious={() => navigateTo(previewIndex - 1)}
            onNext={() => navigateTo(previewIndex + 1)}
            onLoadOriginal={handleGridPreview}
          />
        )
      })()}

      {showUpload && (
        <UploadDialog
          groupId={group.id}
          onUpload={() => { setShowUpload(false); loadFiles() }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {confirmDeleteFile && (
        <ConfirmDialog
          title="Eliminar archivo"
          message={`¿Estás seguro de eliminar "${confirmDeleteFile.name}"? Esta acción no se puede deshacer.`}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteFile(null)}
        />
      )}
    </div>
  )
}
