import { useState, DragEvent } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar } from '../theme/SnackbarContext'
import { useUpload } from '../theme/UploadContext'

interface UploadDialogProps {
  groupId: number
  onClose: () => void
  onUploadComplete: () => void
  topicId?: number
}

function processDroppedFiles(dropped: FileList): Promise<{ name: string; path?: string; data?: number[] }[]> {
  const files = Array.from(dropped)
  return Promise.all(files.map(f => {
    if ((f as any).path) return { name: f.name, path: (f as any).path }
    return f.arrayBuffer().then(buf => ({ name: f.name, data: Array.from(new Uint8Array(buf)) }))
  }))
}

export default function UploadDialog({ groupId, onClose, onUploadComplete, topicId }: UploadDialogProps) {
  const [files, setFiles] = useState<{ name: string; path?: string; data?: number[] }[]>([])
  const [uploading, setUploading] = useState(false)
  const { showSnackbar } = useSnackbar()
  const { addUpload, updateProgress, completeUpload, failUpload } = useUpload()

  const handlePick = async () => {
    const paths: string[] = await window.telegramAPI.pickFiles()
    if (paths && paths.length > 0) {
      setFiles(prev => [...prev, ...paths.map(p => ({ name: p.split(/[\\/]/).pop() || p, path: p }))])
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const tooBig = Array.from(e.dataTransfer.files).filter(f => {
      if ((f as any).path) return false
      return f.size > 100 * 1024 * 1024
    })
    tooBig.forEach(f => showSnackbar(`"${f.name}" es demasiado grande. Arrastra archivos de hasta 100 MB.`, 'warning'))

    const valid = Array.from(e.dataTransfer.files).filter(f => {
      if ((f as any).path) return true
      return f.size <= 100 * 1024 * 1024
    })
    if (valid.length === 0) return
    processDroppedFiles(valid as unknown as FileList).then(results => {
      setFiles(prev => [...prev, ...results])
    })
  }

  const handleUpload = () => {
    if (files.length === 0 || uploading) return
    setUploading(true)

    const uploadPromises = files.map(f => {
      const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      addUpload(uploadId, f.name, f.size)

      const uploadPromise = f.path
        ? window.telegramAPI.uploadFileWithProgress(groupId, f.path, topicId, (p: number) => updateProgress(uploadId, p))
        : f.data
          ? window.telegramAPI.uploadTempFileWithProgress(groupId, f.name, f.data, topicId, (p: number) => updateProgress(uploadId, p))
          : Promise.resolve()

      return uploadPromise
        .then(() => completeUpload(uploadId))
        .catch((err: any) => failUpload(uploadId, err.message || 'No se pudo subir el archivo'))
    })

    showSnackbar(`${files.length} archivos añadidos a la cola de subida`, 'success')
    onUploadComplete()

    Promise.allSettled(uploadPromises).then(() => {
      onUploadComplete()
    })
  }

  return (
    <Dialog open onClose={uploading ? undefined : onClose} maxWidth="sm" fullWidth data-testid="upload-dialog">
      <DialogTitle>{uploading ? 'Preparando subidas...' : 'Subir archivos'}</DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Box
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            mb: 2,
            cursor: 'pointer',
            transition: 'all 200ms',
            '&:hover': {
              borderStyle: 'solid',
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,136,204,0.08)' : 'rgba(0,136,204,0.04)',
            }
          }}
          onClick={handlePick}
          data-testid="upload-dropzone"
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography>Arrastra archivos aquí o haz clic para seleccionarlos</Typography>
        </Box>
        {files.length > 0 && (
          <List dense>
            {files.map((f, i) => (
              <ListItem key={i} secondaryAction={
                <IconButton edge="end" size="small" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }>
                <ListItemText primary={f.name} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading} variant="outlined">Cancelar</Button>
        <Button onClick={handleUpload} variant="contained" color="warning" disabled={files.length === 0 || uploading}>
          {uploading ? 'Iniciando...' : 'Subir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
