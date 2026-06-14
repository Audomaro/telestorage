import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { TelegramFile } from '../types'
import FileListItem from './FileListItem'

interface FileListProps {
  files: TelegramFile[]
  isReadOnly: boolean
  selectMode: boolean
  selectedIds: Set<number>
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  onToggleSelect: (file: TelegramFile) => void
  onPreview?: (file: TelegramFile) => void
}

export default function FileList({ files, isReadOnly, selectMode, selectedIds, onDownload, onDelete, onToggleSelect, onPreview }: FileListProps) {
  if (files.length === 0) {
    return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin archivos</Typography>
  }

  return (
    <Table size="small" sx={{ '& .MuiTableRow-root': { '&:hover': { bgcolor: 'rgba(0,136,204,0.04)' } }, '& .MuiTableCell-root': { borderColor: 'rgba(0,136,204,0.12)' } }}>
      <TableHead>
        <TableRow>
          {selectMode && <TableCell sx={{ width: 36, p: 0.5, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }} />}
          <TableCell sx={{ width: 36, p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }} />
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>Nombre</TableCell>
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>Tamaño</TableCell>
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>Fecha</TableCell>
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>Tipo</TableCell>
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files.map(f => (
          <FileListItem key={f.messageId} file={f} isReadOnly={isReadOnly}
            selectMode={selectMode} selected={selectedIds.has(f.messageId)}
            onDownload={onDownload} onDelete={onDelete} onToggleSelect={onToggleSelect} onPreview={onPreview} />
        ))}
      </TableBody>
    </Table>
  )
}
