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
import ForwardIcon from '@mui/icons-material/Forward'
import { TelegramFile } from '../types'

interface PreviewModalProps {
  file: TelegramFile | null
  files: TelegramFile[]
  groupId: number
  isReadOnly: boolean
  onClose: () => void
  onDelete: (file: TelegramFile) => void
  onForward: (file: TelegramFile) => void
  onSaveToDisk?: (file: TelegramFile) => void
  onNavigate?: (file: TelegramFile) => void
}

export default function PreviewModal({ file, files, groupId, isReadOnly, onClose, onDelete, onForward, onSaveToDisk, onNavigate }: PreviewModalProps) {
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const cancelledRef = useRef(false)

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
        .then(({ url }) => {
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
    return () => { cancelledRef.current = true }
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

  const isPreviewable = file?.mimeType.startsWith('image/') || file?.mimeType.startsWith('video/')
  const isVideo = file?.mimeType.startsWith('video/')

  const handlePrev = () => { if (prevFile) onNavigate?.(prevFile) }
  const handleNext = () => { if (nextFile) onNavigate?.(nextFile) }

  if (!file) return null

  return (
    <Dialog open fullScreen onClose={onClose}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, borderBottom: 1, borderColor: 'divider' }}>
        <IconButton aria-label="Cerrar" onClick={onClose}><CloseIcon /></IconButton>
        {!isReadOnly && (
          <Tooltip title="Reenviar"><IconButton aria-label="Reenviar" onClick={() => onForward(file)}><ForwardIcon /></IconButton></Tooltip>
        )}
        {!isReadOnly && (
          <Tooltip title="Eliminar"><IconButton aria-label="Eliminar" onClick={() => { onClose(); onDelete(file) }}><DeleteIcon /></IconButton></Tooltip>
        )}
        <Tooltip title="Guardar en disco"><IconButton aria-label="Guardar en disco" onClick={() => onSaveToDisk?.(file)}><DownloadIcon /></IconButton></Tooltip>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">{file.name}</Typography>
      </Box>
      <DialogContent sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress variant="determinate" value={progress} size={60} />
          </Box>
        )}
        {!loading && localPath && isPreviewable && !isVideo && (
          <Box component="img" src={localPath} data-testid="preview-image" sx={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain' }} />
        )}
        {!loading && localPath && isVideo && (
          <Box component="video" src={localPath} controls autoPlay sx={{ maxWidth: '90%', maxHeight: '80vh' }} />
        )}
        {!loading && !localPath && (
          <Typography color="text.secondary">{file.name}</Typography>
        )}
        {prevFile && (
          <IconButton onClick={handlePrev} aria-label="Anterior" sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.1)' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
        {nextFile && (
          <IconButton onClick={handleNext} aria-label="Siguiente" sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.1)' }}>
            <ChevronRightIcon />
          </IconButton>
        )}
      </DialogContent>
    </Dialog>
  )
}
