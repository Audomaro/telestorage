import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import { useDownload } from '../theme/DownloadContext'
import DownloadItem from './DownloadItem'

export default function DownloadPanel() {
  const { downloads, removeDownload, completeDownload } = useDownload()

  const activeDownloads = useMemo(() => downloads.filter(d => d.status !== 'completed'), [downloads])
  const completedDownloads = useMemo(() => downloads.filter(d => d.status === 'completed'), [downloads])

  const hasDownloads = downloads.length > 0
  if (!hasDownloads) return null

  const handleClear = () => {
    completedDownloads.forEach(d => removeDownload(d.id))
  }

  const handleOpenFolder = (destPath: string) => {
    window.telegramAPI.showInFolder(destPath)
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        right: 16,
        top: 72,
        width: 320,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2">Descargas</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {completedDownloads.length > 0 && (
            <Button size="small" onClick={handleClear}>Limpiar</Button>
          )}
          <Tooltip title="Cerrar panel">
            <IconButton size="small" onClick={() => downloads.forEach(d => removeDownload(d.id))} aria-label="Cerrar panel">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ overflow: 'auto' }}>
        {downloads.map(task => (
          <DownloadItem
            key={task.id}
            task={task}
            onRemove={() => removeDownload(task.id)}
            onOpenFolder={() => task.destPath && handleOpenFolder(task.destPath)}
            onRetry={() => {
              removeDownload(task.id)
            }}
          />
        ))}
      </Box>
    </Paper>
  )
}
