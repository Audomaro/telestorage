import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Typography from '@mui/material/Typography'
import { TelegramFile, SortField, SortDirection } from '../types'
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
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}

export default function FileList({ files, isReadOnly, selectMode, selectedIds, onDownload, onDelete, onToggleSelect, onPreview, sortField, sortDirection, onSort }: FileListProps) {
  if (files.length === 0) {
    return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin archivos</Typography>
  }

  return (
    <Table size="small" sx={{ '& .MuiTableRow-root': { '&:hover': { bgcolor: 'rgba(0,136,204,0.04)' } }, '& .MuiTableCell-root': { borderColor: 'rgba(0,136,204,0.12)' } }}>
      <TableHead>
        <TableRow>
          {selectMode && <TableCell sx={{ width: 36, p: 0.5, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }} />}
          <TableCell sx={{ width: 36, p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }} />
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
            <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDirection : 'asc'} onClick={() => onSort('name')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
              Nombre
            </TableSortLabel>
          </TableCell>
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
            <TableSortLabel active={sortField === 'size'} direction={sortField === 'size' ? sortDirection : 'asc'} onClick={() => onSort('size')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
              Tamaño
            </TableSortLabel>
          </TableCell>
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
            <TableSortLabel active={sortField === 'date'} direction={sortField === 'date' ? sortDirection : 'asc'} onClick={() => onSort('date')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
              Fecha
            </TableSortLabel>
          </TableCell>
          <TableCell sx={{ p: 1, bgcolor: '#0088cc', color: 'white', fontWeight: 600 }}>
            <TableSortLabel active={sortField === 'type'} direction={sortField === 'type' ? sortDirection : 'asc'} onClick={() => onSort('type')} sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
              Tipo
            </TableSortLabel>
          </TableCell>
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
