import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Badge from '@mui/material/Badge'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DownloadIcon from '@mui/icons-material/Download'
import { useDownload } from '../theme/DownloadContext'
import DownloadItem from './DownloadItem'

export default function DownloadPanel() {
  const { downloads, removeDownload } = useDownload()
  const [collapsed, setCollapsed] = useState(true)

  const completedDownloads = useMemo(() => downloads.filter(d => d.status === 'completed'), [downloads])
  const activeCount = downloads.length - completedDownloads.length

  const handleClear = () => {
    completedDownloads.forEach(d => removeDownload(d.id))
  }

  const handleOpenFolder = (destPath: string) => {
    window.telegramAPI.showInFolder(destPath)
  }

  if (collapsed) {
    return (
      <Box
        sx={{
          position: 'fixed',
          right: 0,
          top: 72,
          zIndex: 1300,
          py: 1,
          px: 0.5,
          borderLeft: 1,
          borderTop: 1,
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: '4px 0 0 4px',
          bgcolor: 'background.paper',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
        }}
        onClick={() => setCollapsed(false)}
      >
        <Tooltip title="Expandir panel">
          <IconButton size="small" aria-label="Expandir panel">
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Badge badgeContent={activeCount} color="primary">
          <DownloadIcon fontSize="small" color="action" />
        </Badge>
      </Box>
    )
  }

  return (
    <Paper
      elevation={4}
      sx={{
        height: '100%',
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2">Descargas</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {completedDownloads.length > 0 && (
            <Button size="small" onClick={handleClear}>Limpiar</Button>
          )}
          <Tooltip title="Colapsar panel">
            <IconButton size="small" onClick={() => setCollapsed(true)} aria-label="Colapsar panel">
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable' }}>
        {downloads.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Sin descargas activas
          </Typography>
        ) : (
          downloads.map(task => (
            <DownloadItem
              key={task.id}
              task={task}
              onRemove={() => removeDownload(task.id)}
              onOpenFolder={() => task.destPath && handleOpenFolder(task.destPath)}
            />
          ))
        )}
      </Box>
    </Paper>
  )
}
