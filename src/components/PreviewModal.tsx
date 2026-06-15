import { useState, useEffect, useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import { TelegramFile } from '../types'

interface PreviewModalProps {
  file: TelegramFile | null
  files: TelegramFile[]
  groupId: number
  isReadOnly: boolean
  onClose: () => void
  onDelete: (file: TelegramFile) => void
  onSaveToDisk?: (file: TelegramFile) => void
  onNavigate?: (file: TelegramFile) => void
}

export default function PreviewModal({ file, files, groupId, isReadOnly, onClose, onDelete, onSaveToDisk, onNavigate }: PreviewModalProps) {
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const cancelledRef = useRef(false)
  const streamIdRef = useRef<string | null>(null)

  const index = file ? files.findIndex(f => f.messageId === file.messageId) : -1
  const prevFile = index > 0 ? files[index - 1] : null
  const nextFile = index < files.length - 1 ? files[index + 1] : null

  useEffect(() => {
    if (!file) return
    setLocalPath('')
    setLoading(true)
    setProgress(0)
    cancelledRef.current = false
    const ext = file.name.split('.').pop() || 'jpg'
    const fileIsVideo = file.mimeType.startsWith('video/')
    
    // For videos, use HTTP streaming server
    // For images, wait for full download
    if (fileIsVideo) {
      window.telegramAPI.startVideoStream(groupId, file.messageId, file.mimeType, file.size)
        .then(({ url, streamId }) => {
          streamIdRef.current = streamId
          if (!cancelledRef.current) { setLocalPath(url); setLoading(false) }
        }).catch(() => {
          if (!cancelledRef.current) setLoading(false)
        })
    } else {
      window.telegramAPI.downloadPreview(groupId, file.messageId, `.${ext}`, (p: number) => {
        if (!cancelledRef.current) setProgress(Math.round(p * 100))
      }).then(path => {
        if (!cancelledRef.current) { setLocalPath(path); setLoading(false) }
      }).catch(() => {
        if (!cancelledRef.current) setLoading(false)
      })
    }
    return () => {
      cancelledRef.current = true
      if (streamIdRef.current) {
        window.telegramAPI.stopVideoStream(streamIdRef.current)
        streamIdRef.current = null
      }
    }
  }, [file, groupId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevFile) {
        onNavigate?.(prevFile)
      } else if (e.key === 'ArrowRight' && nextFile) {
        onNavigate?.(nextFile)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevFile, nextFile, onNavigate, onClose])

  const isPreviewable = file?.mimeType.startsWith('image/') || file?.mimeType.startsWith('video/') || file?.mimeType === 'application/pdf'
  const isVideo = file?.mimeType.startsWith('video/')
  const isPdf = file?.mimeType === 'application/pdf'

  const handlePrev = () => { if (prevFile) onNavigate?.(prevFile) }
  const handleNext = () => { if (nextFile) onNavigate?.(nextFile) }

  if (!file) return null

  return (
    <Dialog open fullScreen onClose={onClose}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, backdropFilter: 'blur(12px)', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton aria-label="Cerrar vista previa" onClick={onClose}><CloseIcon /></IconButton>
        {!isReadOnly && (
          <Tooltip title="Eliminar archivo"><IconButton aria-label="Eliminar archivo" onClick={() => { onClose(); onDelete(file) }}><DeleteIcon /></IconButton></Tooltip>
        )}
        <Tooltip title="Descargar archivo"><IconButton aria-label="Descargar archivo" onClick={() => onSaveToDisk?.(file)}><DownloadIcon /></IconButton></Tooltip>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{file.name}</Typography>
      </Box>
      <DialogContent sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)' }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress variant="determinate" value={progress} size={60} />
          </Box>
        )}
        {!loading && localPath && isPreviewable && !isVideo && !isPdf && (
          <Box component="img" src={localPath} data-testid="preview-image" sx={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain' }} />
        )}
        {!loading && localPath && isVideo && (
          <Box component="video" src={localPath} controls autoPlay sx={{ maxWidth: '90%', maxHeight: '80vh' }} />
        )}
        {!loading && localPath && isPdf && (
          <embed src={`file:///${localPath.replace(/\\/g, '/')}`} type="application/pdf" style={{ width: '90%', height: '80vh', border: 'none', borderRadius: '8px' }} />
        )}
        {!loading && !localPath && (
          <Typography color="text.secondary">{file.name}</Typography>
        )}
        {prevFile && (
          <IconButton onClick={handlePrev} aria-label="Archivo anterior" sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 200ms', '&:hover': { bgcolor: 'white', transform: 'translateY(-50%) scale(1.05)' } }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
        {nextFile && (
          <IconButton onClick={handleNext} aria-label="Archivo siguiente" sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 200ms', '&:hover': { bgcolor: 'white', transform: 'translateY(-50%) scale(1.05)' } }}>
            <ChevronRightIcon />
          </IconButton>
        )}
      </DialogContent>
    </Dialog>
  )
}
