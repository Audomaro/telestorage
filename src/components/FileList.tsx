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
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
}

export default function FileList({ files, isReadOnly, onDownload, onDelete }: FileListProps) {
  if (files.length === 0) {
    return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin archivos</Typography>
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 36, p: 1 }} />
          <TableCell sx={{ p: 1 }}>Nombre</TableCell>
          <TableCell sx={{ p: 1 }}>Tamaño</TableCell>
          <TableCell sx={{ p: 1 }}>Fecha</TableCell>
          <TableCell sx={{ p: 1 }}>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files.map(f => (
          <FileListItem key={f.messageId} file={f} isReadOnly={isReadOnly} onDownload={onDownload} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  )
}
