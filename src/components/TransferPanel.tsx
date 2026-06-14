import { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useDownload } from '../theme/DownloadContext'
import { useUpload } from '../theme/UploadContext'
import TransferItem from './TransferItem'

export default function TransferPanel() {
  const [tab, setTab] = useState(0)
  const { downloads, removeDownload } = useDownload()
  const { uploads, removeUpload } = useUpload()

  const completedDownloads = useMemo(() => downloads.filter(d => d.status === 'completed'), [downloads])
  const completedUploads = useMemo(() => uploads.filter(u => u.status === 'completed'), [uploads])

  const handleClearDownloads = () => {
    completedDownloads.forEach(d => removeDownload(d.id))
  }

  const handleClearUploads = () => {
    completedUploads.forEach(u => removeUpload(u.id))
  }

  const handleOpenFolder = (destPath: string) => {
    window.telegramAPI.showInFolder(destPath)
  }

  return (
    <Paper
      elevation={0}
      data-testid="transfer-panel"
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
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.5, fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', color: '#666', '&.Mui-selected': { color: '#0088cc' } }, '& .MuiTabs-indicator': { backgroundColor: '#0088cc' } }}>
        <Tab label="Descargas" />
        <Tab label="Subidas" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid rgba(0, 136, 204, 0.12)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#222222' }}>Descargas</Typography>
            {completedDownloads.length > 0 && (
              <Button size="small" onClick={handleClearDownloads} sx={{ color: '#0088cc', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.08)' } }}>Limpiar</Button>
            )}
          </Box>
          <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain' }}>
            {downloads.length === 0 ? (
              <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: '#222222', opacity: 0.6 }}>
                Sin descargas activas
              </Typography>
            ) : (
              downloads.map(task => (
                <TransferItem
                  key={task.id}
                  task={task}
                  type="download"
                  onRemove={() => removeDownload(task.id)}
                  onOpenFolder={() => task.destPath && handleOpenFolder(task.destPath)}
                />
              ))
            )}
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid rgba(0, 136, 204, 0.12)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#222222' }}>Subidas</Typography>
            {completedUploads.length > 0 && (
              <Button size="small" onClick={handleClearUploads} sx={{ color: '#0088cc', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(0, 136, 204, 0.08)' } }}>Limpiar</Button>
            )}
          </Box>
          <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain' }}>
            {uploads.length === 0 ? (
              <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: '#222222', opacity: 0.6 }}>
                Sin subidas activas
              </Typography>
            ) : (
              uploads.map(task => (
                <TransferItem
                  key={task.id}
                  task={task}
                  type="upload"
                  onRemove={() => removeUpload(task.id)}
                />
              ))
            )}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
