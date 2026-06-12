import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ViewListIcon from '@mui/icons-material/ViewList'
import GridViewIcon from '@mui/icons-material/GridView'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import { ViewMode, FileFilter } from '../types'

interface ToolbarProps {
  viewMode: ViewMode
  filter: FileFilter
  showUpload: boolean
  selectMode: boolean
  selectedCount: number
  onViewModeChange: (mode: ViewMode) => void
  onFilterChange: (filter: FileFilter) => void
  onUpload: () => void
  onToggleSelectMode: () => void
  onBatchDelete: () => void
  onBatchDownload?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function Toolbar({ viewMode, filter, showUpload, selectMode, selectedCount, onViewModeChange, onFilterChange, onUpload, onToggleSelectMode, onBatchDelete, onBatchDownload, searchQuery, onSearchChange }: ToolbarProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10 }}>
      {viewMode === 'list' && (
        <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, v) => v && onFilterChange(v)}>
          <ToggleButton value="all" aria-label="Filtrar Todos">Todos</ToggleButton>
          <ToggleButton value="media" aria-label="Filtrar Multimedia">Multimedia</ToggleButton>
          <ToggleButton value="documents" aria-label="Filtrar Documentos">Documentos</ToggleButton>
        </ToggleButtonGroup>
      )}
      <TextField
        size="small"
        placeholder="Buscar archivos..."
        value={searchQuery || ''}
        onChange={e => onSearchChange?.(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          },
          htmlInput: { 'data-testid': 'file-search-input' }
        }}
        sx={{ minWidth: 200, '& .MuiInputBase-root': { fontSize: '0.875rem' } }}
      />
      <Box sx={{ flex: 1 }} />
      <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && onViewModeChange(v)}>
        <ToggleButton value="list" aria-label="Vista de lista"><ViewListIcon /></ToggleButton>
        <ToggleButton value="gallery" aria-label="Vista de galería"><GridViewIcon /></ToggleButton>
      </ToggleButtonGroup>
      {!selectMode && showUpload && (
        <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} onClick={onUpload} aria-label="Subir archivos">
          Subir
        </Button>
      )}
      {selectMode && selectedCount > 0 && (
        <Chip label={`${selectedCount} seleccionados`} color="primary" size="small" />
      )}
      <Button
        size="small"
        color={selectMode ? 'error' : 'inherit'}
        variant={selectMode ? 'outlined' : 'text'}
        startIcon={selectMode ? <CloseIcon /> : <CheckBoxIcon />}
        onClick={onToggleSelectMode}
        aria-label={selectMode ? 'Cancelar selección' : 'Seleccionar archivos'}
      >
        {selectMode ? 'Cancelar' : 'Seleccionar'}
      </Button>
      {selectMode && selectedCount > 0 && (
        <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={onBatchDownload} aria-label="Descargar seleccionados">
          Descargar
        </Button>
      )}
      {selectMode && selectedCount > 0 && (
        <Button size="small" color="error" variant="contained" startIcon={<DeleteIcon />} onClick={onBatchDelete} aria-label="Eliminar seleccionados">
          Eliminar
        </Button>
      )}
    </Box>
  )
}
