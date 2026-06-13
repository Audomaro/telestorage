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
      elevation={0}
      data-testid="download-panel"
      sx={{
        height: '100%',
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(0, 136, 204, 0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid rgba(0, 136, 204, 0.12)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#222222' }}>Descargas</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {completedDownloads.length > 0 && (
            <Button size="small" onClick={handleClear} sx={{ color: '#0088cc', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.08)' } }}>Limpiar</Button>
          )}
        </Box>
      </Box>
      <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain' }}>
        {downloads.length === 0 ? (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: '#222222', opacity: 0.6 }}>
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
