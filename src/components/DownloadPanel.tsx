import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useDownload } from '../theme/DownloadContext'
import DownloadItem from './DownloadItem'

export default function DownloadPanel() {
  const { downloads, removeDownload } = useDownload()

  const completedDownloads = useMemo(() => downloads.filter(d => d.status === 'completed'), [downloads])

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
