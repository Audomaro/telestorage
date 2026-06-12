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
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar } from '../theme/SnackbarContext'

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
    tooBig.forEach(f => showSnackbar(`"${f.name}" es demasiado grande para arrastrar (máx. 100 MB)`, 'warning'))

    const valid = Array.from(e.dataTransfer.files).filter(f => {
      if ((f as any).path) return true
      return f.size <= 100 * 1024 * 1024
    })
    if (valid.length === 0) return
    processDroppedFiles(valid as unknown as FileList).then(results => {
      setFiles(prev => [...prev, ...results])
    })
  }

  const handleUpload = async () => {
    if (files.length === 0 || uploading) return
    setUploading(true)
    const errors: string[] = []
    for (const f of files) {
      try {
        if (f.path) {
          await window.telegramAPI.uploadFile(groupId, f.path, topicId)
        } else if (f.data) {
          await window.telegramAPI.uploadTempFile(groupId, f.name, f.data, topicId)
        }
      } catch {
        errors.push(f.name)
      }
    }
    setUploading(false)
    if (errors.length > 0) {
      showSnackbar(`Errores al subir:\n${errors.join(', ')}`, 'error')
    }
    onUploadComplete()
  }

  return (
    <Dialog open onClose={uploading ? undefined : onClose} maxWidth="sm" fullWidth data-testid="upload-dialog">
      <DialogTitle>{uploading ? 'Subiendo archivos...' : 'Subir archivos'}</DialogTitle>
      <DialogContent>
        <Box
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center', mb: 2, cursor: 'pointer' }}
          onClick={handlePick}
          data-testid="upload-dropzone"
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">Arrastra archivos aquí o haz clic para seleccionar</Typography>
        </Box>
        {files.length > 0 && (
          <List dense>
            {files.map((f, i) => (
              <ListItem key={i} secondaryAction={
                <IconButton edge="end" size="small" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }>
                <Typography variant="body2">{f.name}</Typography>
              </ListItem>
            ))}
          </List>
        )}
        {uploading && <LinearProgress sx={{ mt: 1 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>Cancelar</Button>
        <Button onClick={handleUpload} variant="contained" disabled={files.length === 0 || uploading}>
          {uploading ? 'Subiendo...' : 'Subir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
