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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1, borderBottom: 1, borderColor: 'divider' }} data-testid="download-item">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isCompleted ? <CheckCircleIcon fontSize="small" color="success" /> : isError ? <ErrorIcon fontSize="small" color="error" /> : <InsertDriveFileIcon fontSize="small" color="action" />}
        <Typography variant="body2" noWrap sx={{ flex: 1 }}>{task.fileName}</Typography>
        {isCompleted && (
          <Tooltip title="Abrir carpeta">
            <IconButton size="small" onClick={onOpenFolder} aria-label="Abrir carpeta"><FolderOpenIcon fontSize="small" /></IconButton>
          </Tooltip>
        )}

        <Tooltip title="Eliminar">
          <IconButton size="small" onClick={onRemove} aria-label="Eliminar"><CloseIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={isCompleted ? 100 : isError ? 100 : Math.round(task.progress * 100)}
          color={isCompleted ? 'success' : isError ? 'error' : 'primary'}
          sx={{ flex: 1, height: 4 }}
        />
        <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right' }}>
          {isCompleted ? '100%' : isError ? 'Error' : `${Math.round(task.progress * 100)}%`}
        </Typography>
      </Box>
      {isError && (
        <Typography variant="caption" color="error">{task.error}</Typography>
      )}
    </Box>
  )
}
