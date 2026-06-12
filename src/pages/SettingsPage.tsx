import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FolderIcon from '@mui/icons-material/Folder'
import { useSnackbar } from '../theme/SnackbarContext'

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [downloadPath, setDownloadPath] = useState('')
  const [batchSize, setBatchSize] = useState(50)
  const [defaultTab, setDefaultTab] = useState<'created' | 'active' | 'archived'>('created')
  const [excludedTags, setExcludedTags] = useState<string[]>([])
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [saving, setSaving] = useState(false)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
      setBatchSize(s.batchSize ?? 50)
      setDefaultTab(s.defaultTab ?? 'created')
      if (s.excludedFromMedia) setExcludedTags(s.excludedFromMedia)
      setThemeMode(s.themeMode ?? 'light')
    })
  }, [])

  const handleSelectFolder = async () => {
    const path = await window.telegramAPI.selectFolder()
    if (path) setDownloadPath(path)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.telegramAPI.setSettings({
        downloadPath,
        batchSize,
        defaultTab,
        excludedFromMedia: [...new Set(excludedTags.map(t => t.toLowerCase().trim()))].filter(Boolean),
        themeMode,
      })
      showSnackbar('Configuración guardada', 'success')
    } catch {
      showSnackbar('Error al guardar configuración', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 500 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>Apariencia</Typography>
        <Box>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tema</InputLabel>
            <Select value={themeMode} label="Tema"
              onChange={e => setThemeMode(e.target.value as 'light' | 'dark')}>
              <MenuItem value="light">Claro</MenuItem>
              <MenuItem value="dark">Oscuro</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>Navegación</Typography>
        <Box>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Pestaña por defecto al iniciar</InputLabel>
            <Select value={defaultTab} label="Pestaña por defecto al iniciar"
              onChange={e => setDefaultTab(e.target.value as 'created' | 'active' | 'archived')}>
              <MenuItem value="created">TeleStorage</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="archived">Archivados</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>Descargas</Typography>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Carpeta de descargas</Typography>
          <TextField fullWidth size="small" value={downloadPath} slotProps={{
            input: {
              readOnly: true,
              endAdornment: <Button size="small" onClick={handleSelectFolder} startIcon={<FolderIcon />}>Cambiar</Button>
            }
          }} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Archivos por carga (batch size)</Typography>
          <TextField type="number" size="small" sx={{ width: 120 }}
            value={batchSize} onChange={e => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))} />
        </Box>

        <Divider />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>Avanzado</Typography>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Extensiones ignoradas en galería y multimedia</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={excludedTags}
            onChange={(_, val) => setExcludedTags(val.map(v => v.toLowerCase().trim()).filter(Boolean))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} size="small" {...getTagProps({ index })} />
              ))
            }
            renderInput={params => (
              <TextField {...params} size="small" placeholder="svg, webp, bmp..." />
            )}
          />
          <Typography variant="caption" color="text.secondary">Estos archivos se tratarán como documentos y no aparecerán en Multimedia ni Galería.</Typography>
        </Box>

        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start', mt: 1 }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </Box>
    </Box>
  )
}
