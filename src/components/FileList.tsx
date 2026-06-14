import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
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
    <Box sx={{ overflow: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {selectMode && <TableCell sx={{ width: 36, p: 0.5 }} />}
            <TableCell sx={{ width: 36, p: 1 }} />
            <TableCell sx={{ p: 1 }}>Nombre</TableCell>
            <TableCell sx={{ p: 1 }}>Tamaño</TableCell>
            <TableCell sx={{ p: 1 }}>Fecha</TableCell>
            <TableCell sx={{ p: 1 }}>Tipo</TableCell>
            <TableCell sx={{ p: 1 }}>Acciones</TableCell>
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
    </Box>
  )
}
