import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ImageIcon from '@mui/icons-material/Image'
import MovieIcon from '@mui/icons-material/Movie'
import { TelegramFile } from '../types'
import { formatFileSize, formatDate } from '../utils/format'

interface FileListItemProps {
  file: TelegramFile
  isReadOnly: boolean
  selectMode: boolean
  selected: boolean
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  onToggleSelect: (file: TelegramFile) => void
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon fontSize="small" />
  if (mimeType.startsWith('video/')) return <MovieIcon fontSize="small" />
  return <InsertDriveFileIcon fontSize="small" />
}

export default function FileListItem({ file, isReadOnly, selectMode, selected, onDownload, onDelete, onToggleSelect }: FileListItemProps) {
  return (
    <TableRow hover selected={selected}>
      {selectMode && (
        <TableCell sx={{ width: 36, p: 0.5 }}>
          <Checkbox size="small" checked={selected} onChange={() => onToggleSelect(file)} />
        </TableCell>
      )}
      <TableCell sx={{ width: 36, p: 1 }}>{fileIcon(file.mimeType)}</TableCell>
      <TableCell sx={{ p: 1 }}>
        <Typography variant="body2" noWrap>{file.name}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">{formatFileSize(file.size)}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">{formatDate(file.date)}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <IconButton size="small" onClick={() => onDownload(file)} aria-label="Descargar"><DownloadIcon fontSize="small" /></IconButton>
        {!isReadOnly && !selectMode && (
          <IconButton size="small" onClick={() => onDelete(file)} aria-label="Eliminar"><DeleteIcon fontSize="small" /></IconButton>
        )}
      </TableCell>
    </TableRow>
  )
}
