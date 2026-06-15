import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import ImageIcon from '@mui/icons-material/Image'
import MovieIcon from '@mui/icons-material/Movie'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import ReplayIcon from '@mui/icons-material/Replay'
import { DownloadTask } from '../theme/DownloadContext'
import { UploadTask } from '../theme/UploadContext'

type TransferTask = DownloadTask | UploadTask

interface TransferItemProps {
  task: TransferTask
  type: 'download' | 'upload'
  onRemove: () => void
  onOpenFolder?: () => void
  onRetry?: () => void
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileTypeIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) return <ImageIcon fontSize="small" color="primary" />
  if (['mp4', 'webm', 'avi', 'mkv', 'mov', 'flv'].includes(ext || '')) return <MovieIcon fontSize="small" color="secondary" />
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext || '')) return <AudioFileIcon fontSize="small" color="success" />
  if (['pdf'].includes(ext || '')) return <InsertDriveFileIcon fontSize="small" color="warning" />
  return <InsertDriveFileIcon fontSize="small" color="primary" />
}

export default function TransferItem({ task, type, onRemove, onOpenFolder, onRetry }: TransferItemProps) {
  const isCompleted = task.status === 'completed'
  const isError = task.status === 'error'
  const isActive = task.status === 'uploading' || task.status === 'downloading'

  const onRemoveRef = useRef(onRemove)
  onRemoveRef.current = onRemove

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => onRemoveRef.current(), 10000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        transition: 'background-color 200ms',
        '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
      }}
      data-testid="transfer-item"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isCompleted ? <CheckCircleIcon fontSize="small" color="success" /> : isError ? <ErrorIcon fontSize="small" color="error" /> : fileTypeIcon(task.fileName)}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{task.fileName}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {formatSize(task.fileSize)}{task.fileSize && isActive ? ' · ' : ''}{isActive ? `${Math.round(task.progress * 100)}%` : ''}
          </Typography>
        </Box>
        {type === 'download' && isCompleted && onOpenFolder && (
          <Tooltip title="Abrir ubicación">
            <IconButton size="small" onClick={onOpenFolder} aria-label="Abrir ubicación">
              <FolderOpenIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        )}
        {isError && onRetry && (
          <Tooltip title="Reintentar">
            <IconButton size="small" onClick={onRetry} aria-label="Reintentar">
              <ReplayIcon fontSize="small" color="warning" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Quitar de la lista">
          <IconButton size="small" onClick={onRemove} aria-label="Quitar de la lista">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={isCompleted ? 100 : isError ? 100 : Math.round(task.progress * 100)}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              transition: 'transform 300ms ease',
            },
          }}
          color={isError ? 'error' : isCompleted ? 'success' : 'primary'}
        />
        <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right', fontWeight: 500 }}>
          {isCompleted ? '100%' : isError ? 'Error' : `${Math.round(task.progress * 100)}%`}
        </Typography>
      </Box>
      {isError && task.error && (
        <Typography variant="caption" color="error">{task.error}</Typography>
      )}
    </Box>
  )
}
