import Box from '@mui/material/Box'
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
}

export default function Toolbar({ viewMode, filter, showUpload, selectMode, selectedCount, onViewModeChange, onFilterChange, onUpload, onToggleSelectMode, onBatchDelete }: ToolbarProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10 }}>
      <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, v) => v && onFilterChange(v)}>
        <ToggleButton value="all">Todos</ToggleButton>
        <ToggleButton value="media">Multimedia</ToggleButton>
        <ToggleButton value="documents">Documentos</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ flex: 1 }} />
      <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && onViewModeChange(v)}>
        <ToggleButton value="list"><ViewListIcon /></ToggleButton>
        <ToggleButton value="gallery"><GridViewIcon /></ToggleButton>
      </ToggleButtonGroup>
      {!selectMode && showUpload && (
        <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} onClick={onUpload}>
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
      >
        {selectMode ? 'Cancelar' : 'Seleccionar'}
      </Button>
      {selectMode && selectedCount > 0 && (
        <Button size="small" color="error" variant="contained" startIcon={<DeleteIcon />} onClick={onBatchDelete}>
          Eliminar
        </Button>
      )}
    </Box>
  )
}
