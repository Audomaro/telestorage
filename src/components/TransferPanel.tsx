import { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Badge from '@mui/material/Badge'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CloseIcon from '@mui/icons-material/Close'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { useDownload } from '../theme/DownloadContext'
import { useUpload } from '../theme/UploadContext'
import { DownloadTask } from '../theme/DownloadContext'
import { UploadTask } from '../theme/UploadContext'
import TransferItem from './TransferItem'

type TransferTask = DownloadTask | UploadTask

interface TransferPanelProps {
  onClose?: () => void
}

export default function TransferPanel({ onClose }: TransferPanelProps) {
  const [tab, setTab] = useState(0)
  const { downloads, removeDownload, retryDownload } = useDownload()
  const { uploads, removeUpload, retryUpload } = useUpload()

  const sortedDownloads = useMemo(() => [...downloads].reverse(), [downloads])
  const sortedUploads = useMemo(() => [...uploads].reverse(), [uploads])

  const completedDownloads = useMemo(() => downloads.filter(d => d.status === 'completed'), [downloads])
  const completedUploads = useMemo(() => uploads.filter(u => u.status === 'completed'), [uploads])
  const activeDownloads = useMemo(() => downloads.filter(d => d.status === 'downloading'), [downloads])
  const activeUploads = useMemo(() => uploads.filter(u => u.status === 'uploading'), [uploads])
  const errorDownloads = useMemo(() => downloads.filter(d => d.status === 'error'), [downloads])
  const errorUploads = useMemo(() => uploads.filter(u => u.status === 'error'), [uploads])

  const handleClearDownloads = () => {
    completedDownloads.forEach(d => removeDownload(d.id))
  }

  const handleClearUploads = () => {
    completedUploads.forEach(u => removeUpload(u.id))
  }

  const handleOpenFolder = (destPath: string) => {
    window.telegramAPI.showInFolder(destPath)
  }

  const renderEmpty = (icon: React.ReactNode, label: string) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 4, color: 'text.secondary' }}>
      {icon}
      <Typography variant="body2">{label}</Typography>
    </Box>
  )

  const renderItems = (items: TransferTask[], type: 'download' | 'upload') => (
    items.map(task => (
      <TransferItem
        key={task.id}
        task={task}
        type={type}
        onRemove={() => type === 'download' ? removeDownload(task.id) : removeUpload(task.id)}
        onOpenFolder={type === 'download' && (task as DownloadTask).destPath ? () => handleOpenFolder((task as DownloadTask).destPath!) : undefined}
        onRetry={task.status === 'error' ? () => type === 'download' ? retryDownload(task.id) : retryUpload(task.id) : undefined}
      />
    ))
  )

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
        borderRadius: 2,
        border: 1, borderColor: 'divider',
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          '& .MuiTab-root': { minHeight: 40, py: 0.5, fontWeight: 600, fontSize: '0.8rem', textTransform: 'none' },
          '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
        }}
      >
        <Tab
          label={
            <Badge badgeContent={activeDownloads.length + errorDownloads.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
              Descargas
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={activeUploads.length + errorUploads.length} color="warning" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
              Subidas
            </Badge>
          }
        />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Descargas{downloads.length > 0 && ` (${downloads.length})`}
            </Typography>
            {completedDownloads.length > 0 && (
              <Button size="small" onClick={handleClearDownloads} startIcon={<CloseIcon />} sx={{ fontWeight: 600 }}>Limpiar completadas</Button>
            )}
          </Box>
          <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain', flex: 1 }}>
            {sortedDownloads.length === 0
              ? renderEmpty(<CloudDownloadIcon sx={{ fontSize: 40 }} />, 'No hay descargas')
              : renderItems(sortedDownloads, 'download')}
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Subidas{uploads.length > 0 && ` (${uploads.length})`}
            </Typography>
            {completedUploads.length > 0 && (
              <Button size="small" onClick={handleClearUploads} startIcon={<CloseIcon />} sx={{ fontWeight: 600 }}>Limpiar completadas</Button>
            )}
          </Box>
          <Box sx={{ overflow: 'auto', overscrollBehavior: 'contain', flex: 1 }}>
            {sortedUploads.length === 0
              ? renderEmpty(<CloudUploadIcon sx={{ fontSize: 40 }} />, 'No hay subidas')
              : renderItems(sortedUploads, 'upload')}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
