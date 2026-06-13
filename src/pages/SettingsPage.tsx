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
import Skeleton from '@mui/material/Skeleton'
import FolderIcon from '@mui/icons-material/Folder'
import DescriptionIcon from '@mui/icons-material/Description'
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
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
      setBatchSize(s.batchSize ?? 50)
      setDefaultTab(s.defaultTab ?? 'created')
      if (s.excludedFromMedia) setExcludedTags(s.excludedFromMedia)
      setThemeMode(s.themeMode ?? 'light')
      setLoaded(true)
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
    <Box sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 2, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid rgba(0,136,204,0.12)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} data-testid="settings-page">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {!loaded ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }} data-testid="settings-skeleton">
            {[1, 2, 3].map(i => (
              <Box key={i}>
                <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(0,136,204,0.15)' }} />
                <Skeleton variant="rounded" height={40} sx={{ mt: 0.5, bgcolor: 'rgba(0,136,204,0.1)' }} />
              </Box>
            ))}
          </Box>
        ) : (
          <>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0088cc' }}>Apariencia</Typography>
        <Box>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="theme-label">Tema</InputLabel>
            <Select value={themeMode} label="Tema" labelId="theme-label" id="theme-select"
              onChange={e => setThemeMode(e.target.value as 'light' | 'dark')}
              sx={{ borderRadius: '8px', '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0088cc' } }}>
              <MenuItem value="light">Claro</MenuItem>
              <MenuItem value="dark">Oscuro</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ borderColor: 'rgba(0,136,204,0.15)', my: 1.5 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0088cc' }}>Navegación</Typography>
        <Box>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="default-tab-label">Pestaña por defecto al iniciar</InputLabel>
            <Select value={defaultTab} label="Pestaña por defecto al iniciar" labelId="default-tab-label" id="default-tab-select"
              onChange={e => setDefaultTab(e.target.value as 'created' | 'active' | 'archived')}
              sx={{ borderRadius: '8px', '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0088cc' } }}>
              <MenuItem value="created">TeleStorage</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="archived">Archivados</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ borderColor: 'rgba(0,136,204,0.15)', my: 1.5 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0088cc' }}>Descargas</Typography>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Carpeta de descargas</Typography>
          <TextField data-testid="download-path-field" fullWidth size="small" value={downloadPath} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0088cc' } } }} slotProps={{
            input: {
              readOnly: true,
              endAdornment: <Button size="small" onClick={handleSelectFolder} startIcon={<FolderIcon />}>Cambiar</Button>
            }
          }} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Archivos por carga (batch size)</Typography>
          <TextField data-testid="batch-size-input" type="number" size="small" sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '8px', '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0088cc' } } }}
            value={batchSize} onChange={e => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))} />
        </Box>

        <Divider sx={{ borderColor: 'rgba(0,136,204,0.15)', my: 1.5 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0088cc' }}>Avanzado</Typography>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Extensiones ignoradas en galería y multimedia</Typography>
          <Autocomplete
            data-testid="excluded-extensions-input"
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          <Typography variant="caption" color="text.secondary">Estos archivos se tratarán como documentos y no aparecerán en Multimedia ni Galería.</Typography>
        </Box>
        <Box>
          <Button size="small" variant="outlined" startIcon={<DescriptionIcon />} onClick={() => window.telegramAPI.openLogFolder()}
            sx={{ borderColor: '#F97316', color: '#F97316', fontWeight: 600, borderRadius: '8px', '&:hover': { borderColor: '#EA580C', bgcolor: 'rgba(249,115,22,0.06)', transform: 'translateY(-1px)' } }}>
            Abrir carpeta de logs
          </Button>
        </Box>

        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start', mt: 1, bgcolor: '#0088cc', borderRadius: '8px', fontWeight: 600, '&:hover': { bgcolor: '#0077b3', transform: 'translateY(-1px)' } }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
          </>
        )}
      </Box>
    </Box>
  )
}
