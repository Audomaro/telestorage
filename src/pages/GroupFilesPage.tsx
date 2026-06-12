import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import { TelegramGroup, TelegramFile, ViewMode, FileFilter } from '../types'
import Toolbar from '../components/Toolbar'
import FileList from '../components/FileList'
import FileGrid from '../components/FileGrid'
import PreviewModal from '../components/PreviewModal'
import UploadDialog from '../components/UploadDialog'
import EmptyState from '../components/EmptyState'
import { isMedia, isDocument, isExcludedFromMedia } from '../utils/fileTypes'
import { useSnackbar } from '../theme/SnackbarContext'

interface GroupFilesPageProps {
  group: TelegramGroup
  onBack: () => void
  onSettings?: () => void
}

export default function GroupFilesPage({ group, onBack, onSettings }: GroupFilesPageProps) {
  const [allFiles, setAllFiles] = useState<TelegramFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FileFilter>('all')
  const [previewFile, setPreviewFile] = useState<TelegramFile | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<TelegramFile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const offsetRef = useRef<number | undefined>(undefined)
  const [excludedFromMedia, setExcludedFromMedia] = useState<string[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false)
  const { showSnackbar } = useSnackbar()

  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])

  const loadInitialFiles = useCallback(async () => {
    setAllFiles([])
    setHasMore(true)
    hasMoreRef.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await window.telegramAPI.loadMoreFiles(group.id)
      setAllFiles(result.files)
      setHasMore(result.hasMore)
      hasMoreRef.current = result.hasMore
      offsetRef.current = result.nextOffsetId
    } catch (err: any) {
      setError(err.message || 'Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }, [group.id])

  useEffect(() => { loadInitialFiles() }, [loadInitialFiles])

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      if (s.excludedFromMedia) setExcludedFromMedia(s.excludedFromMedia)
    })
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const result = await window.telegramAPI.loadMoreFiles(group.id, offsetRef.current)
      offsetRef.current = result.nextOffsetId
      setAllFiles(prev => [...prev, ...result.files])
      setHasMore(result.hasMore)
      hasMoreRef.current = result.hasMore
    } catch (err: any) {
      setError(err.message || 'Error al cargar más archivos')
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [group.id])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        handleLoadMore()
      }
    }, { rootMargin: '200px' })

    observer.observe(el)
    return () => observer.disconnect()
  }, [handleLoadMore, loading])

  const filteredFiles = useMemo(() => {
    let result = allFiles
    if (filter === 'media') return result.filter(f => isMedia(f.mimeType) && !isExcludedFromMedia(f.name, excludedFromMedia))
    if (filter === 'documents') return result.filter(f => isDocument(f.mimeType) || isExcludedFromMedia(f.name, excludedFromMedia))
    if (viewMode === 'gallery') return result.filter(f => isMedia(f.mimeType) && !isExcludedFromMedia(f.name, excludedFromMedia))
    return result
  }, [allFiles, filter, viewMode, excludedFromMedia])

  const handleDownload = async (file: TelegramFile) => {
    try {
      const settings = await window.telegramAPI.getSettings()
      const destPath = `${settings.downloadPath}\\${file.messageId}_${file.name}`
      await window.telegramAPI.downloadFile(group.id, file.messageId, destPath)
    } catch (err: any) {
      showSnackbar(err.message || 'Error al descargar', 'error')
    }
  }

  const handleSaveToDisk = async (file: TelegramFile) => {
    try {
      const settings = await window.telegramAPI.getSettings()
      const destPath = `${settings.downloadPath}\\${file.messageId}_${file.name}`
      await window.telegramAPI.downloadFile(group.id, file.messageId, destPath)
    } catch (err: any) {
      showSnackbar(err.message || 'Error al guardar', 'error')
    }
  }

  const handlePreviewOpen = (file: TelegramFile) => {
    setPreviewFile(file)
  }

  const handleDelete = (file: TelegramFile) => {
    setConfirmDeleteFile(file)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteFile) return
    setDeleting(true)
    try {
      await window.telegramAPI.deleteFile(group.id, confirmDeleteFile.messageId)
      setPreviewFile(null)
      setConfirmDeleteFile(null)
      loadInitialFiles()
    } catch (err: any) {
      showSnackbar(err.message || 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleForward = async (file: TelegramFile) => {
    const targetId = prompt('ID del grupo destino:')
    if (!targetId) return
    try {
      await window.telegramAPI.forwardFile(group.id, Number(targetId), file.messageId)
      showSnackbar('Archivo reenviado', 'success')
    } catch (err: any) {
      showSnackbar(err.message || 'Error al reenviar', 'error')
    }
  }

  const handleToggleSelect = (file: TelegramFile) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(file.messageId)) next.delete(file.messageId)
      else next.add(file.messageId)
      return next
    })
  }

  const handleToggleSelectMode = () => {
    setSelectMode(prev => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }

  const handleBatchDelete = async () => {
    setDeleting(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id => window.telegramAPI.deleteFile(group.id, id)))
      setSelectedIds(new Set())
      setSelectMode(false)
      setConfirmBatchDelete(false)
      loadInitialFiles()
      showSnackbar(`${ids.length} archivo(s) eliminado(s)`, 'success')
    } catch (err: any) {
      showSnackbar(err.message || 'Error al eliminar archivos', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        onUpload={() => setShowUpload(true)}
        showUpload={group.isOwner}
        selectMode={selectMode}
        selectedCount={selectedIds.size}
        onToggleSelectMode={handleToggleSelectMode}
        onBatchDelete={() => setConfirmBatchDelete(true)}
      />

      <Box component="main" sx={{ flex: 1 }}>
        {loading ? (
          viewMode === 'list' ? (
            <Box sx={{ px: 2 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" sx={{ flex: 1 }} />
                  <Skeleton variant="text" width={60} />
                  <Skeleton variant="text" width={80} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, p: 1 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '1' }} />
              ))}
            </Box>
          )
        ) : error ? (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mt: 1 }}>
            {error}
            <Button size="small" onClick={loadInitialFiles} sx={{ ml: 1 }}>Reintentar</Button>
          </Alert>
        ) : viewMode === 'list' ? (
          <FileList files={filteredFiles} isReadOnly={!group.isOwner}
            selectMode={selectMode} selectedIds={selectedIds}
            onDownload={handleDownload} onDelete={handleDelete} onToggleSelect={handleToggleSelect} />
        ) : (
          <FileGrid files={filteredFiles} selectMode={selectMode} selectedIds={selectedIds}
            onPreview={handlePreviewOpen} onToggleSelect={handleToggleSelect} />
        )}
        {filteredFiles.length === 0 && !loading && !error && (
          <EmptyState
            icon={filter === 'media' ? <ImageOutlined /> : <InsertDriveFileOutlined />}
            title={filter === 'media' ? 'Sin archivos multimedia' : 'Sin archivos'}
          />
        )}
        {hasMore && !loading && (
          <div ref={sentinelRef}>
            {loadingMore && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>}
          </div>
        )}
      </Box>

      {previewFile && (
        <PreviewModal
          file={previewFile}
          files={filteredFiles}
          groupId={group.id}
          isReadOnly={!group.isOwner}
          onClose={() => setPreviewFile(null)}
          onDelete={handleDelete}
          onForward={handleForward}
          onSaveToDisk={handleSaveToDisk}
        />
      )}

      {showUpload && (
        <UploadDialog
          groupId={group.id}
          onUploadComplete={() => { setShowUpload(false); loadInitialFiles() }}
          onClose={() => setShowUpload(false)}
        />
      )}

      <Dialog open={!!confirmDeleteFile} onClose={() => setConfirmDeleteFile(null)}>
        <DialogTitle>Eliminar archivo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de eliminar "{confirmDeleteFile?.name}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteFile(null)}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBatchDelete} onClose={() => setConfirmBatchDelete(false)}>
        <DialogTitle>Eliminar archivos</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de eliminar {selectedIds.size} archivo(s)? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBatchDelete(false)}>Cancelar</Button>
          <Button onClick={handleBatchDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
