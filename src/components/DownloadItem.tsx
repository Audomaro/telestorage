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
import { DownloadTask } from '../theme/DownloadContext'

interface DownloadItemProps {
  task: DownloadTask
  onRemove: () => void
  onOpenFolder: () => void
}

export default function DownloadItem({ task, onRemove, onOpenFolder }: DownloadItemProps) {
  const isCompleted = task.status === 'completed'
  const isError = task.status === 'error'
  const isDownloading = task.status === 'downloading'

  const onRemoveRef = useRef(onRemove)
  onRemoveRef.current = onRemove

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => onRemoveRef.current(), 10000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5, borderBottom: '1px solid rgba(0, 136, 204, 0.08)', transition: 'all 200ms', '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.02)' } }} data-testid="download-item">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isCompleted ? <CheckCircleIcon fontSize="small" sx={{ color: '#0088cc' }} /> : isError ? <ErrorIcon fontSize="small" color="error" /> : <InsertDriveFileIcon fontSize="small" sx={{ color: '#0088cc' }} />}
        <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: 600, color: '#222222' }}>{task.fileName}</Typography>
        {isCompleted && (
          <Tooltip title="Abrir carpeta">
            <IconButton size="small" onClick={onOpenFolder} aria-label="Abrir carpeta" sx={{ '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.08)' } }}><FolderOpenIcon fontSize="small" sx={{ color: '#0088cc' }} /></IconButton>
          </Tooltip>
        )}

        <Tooltip title="Eliminar">
          <IconButton size="small" onClick={onRemove} aria-label="Eliminar" sx={{ '&:hover': { backgroundColor: 'rgba(243, 115, 22, 0.08)' } }}><CloseIcon fontSize="small" /></IconButton>
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
            backgroundColor: 'rgba(0, 136, 204, 0.12)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: isCompleted ? '#0088cc' : isError ? '#EF4444' : '#0088cc',
              borderRadius: 3,
              transition: 'transform 200ms',
            }
          }}
        />
        <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right', color: '#222222', fontWeight: 500 }}>
          {isCompleted ? '100%' : isError ? 'Error' : `${Math.round(task.progress * 100)}%`}
        </Typography>
      </Box>
      {isError && (
        <Typography variant="caption" sx={{ color: '#EF4444' }}>{task.error}</Typography>
      )}
    </Box>
  )
}
