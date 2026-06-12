import Box from '@mui/material/Box'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import ViewListIcon from '@mui/icons-material/ViewList'
import GridViewIcon from '@mui/icons-material/GridView'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { ViewMode, FileFilter } from '../types'

interface ToolbarProps {
  viewMode: ViewMode
  filter: FileFilter
  showUpload: boolean
  onViewModeChange: (mode: ViewMode) => void
  onFilterChange: (filter: FileFilter) => void
  onUpload: () => void
}

export default function Toolbar({ viewMode, filter, showUpload, onViewModeChange, onFilterChange, onUpload }: ToolbarProps) {
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
      {showUpload && (
        <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} onClick={onUpload}>
          Subir
        </Button>
      )}
    </Box>
  )
}
