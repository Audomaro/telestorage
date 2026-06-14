import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import Tooltip from '@mui/material/Tooltip'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import PreviewIcon from '@mui/icons-material/Preview'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ImageIcon from '@mui/icons-material/Image'
import MovieIcon from '@mui/icons-material/Movie'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AudioFileIcon from '@mui/icons-material/AudioFile'
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
  onPreview?: (file: TelegramFile) => void
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon fontSize="small" color="primary" />
  if (mimeType.startsWith('video/')) return <MovieIcon fontSize="small" color="secondary" />
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon fontSize="small" color="warning" />
  if (mimeType.startsWith('audio/')) return <AudioFileIcon fontSize="small" color="success" />
  return <InsertDriveFileIcon fontSize="small" />
}

export default function FileListItem({ file, isReadOnly, selectMode, selected, onDownload, onDelete, onToggleSelect, onPreview }: FileListItemProps) {
  const isPreviewable = file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') || file.mimeType === 'application/pdf'

  const handleRowClick = () => {
    if (selectMode) onToggleSelect(file)
    else if (isPreviewable && onPreview) onPreview(file)
  }

  return (
    <TableRow
      hover
      selected={selected}
      onClick={handleRowClick}
      data-testid="file-list-item"
      sx={{
        cursor: 'pointer',
        transition: 'background-color 200ms',
        '&:hover': {
          '& .row-actions': { opacity: 1 },
        },
        '& .row-actions': { opacity: 0, transition: 'opacity 200ms' },
      }}
    >
      {selectMode && (
        <TableCell sx={{ width: 36, p: 0.5 }}>
          <Checkbox size="small" checked={selected} onChange={() => onToggleSelect(file)} />
        </TableCell>
      )}
      <TableCell sx={{ width: 36, p: 1 }}>{fileIcon(file.mimeType)}</TableCell>
      <TableCell sx={{ p: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{file.name}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">{formatFileSize(file.size)}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">{formatDate(file.date)}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">{file.mimeType.split('/').pop()?.toUpperCase() || file.mimeType}</Typography>
      </TableCell>
      <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }} className="row-actions">
        <Tooltip title="Descargar">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDownload(file) }} aria-label="Descargar">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isPreviewable && onPreview && (
          <Tooltip title="Vista previa">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onPreview(file) }} aria-label="Vista previa" color="primary">
              <PreviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {!isReadOnly && !selectMode && (
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(file) }} aria-label="Eliminar">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}
