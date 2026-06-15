import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Fade from '@mui/material/Fade'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import FolderIcon from '@mui/icons-material/Folder'
import DescriptionIcon from '@mui/icons-material/Description'
import PaletteIcon from '@mui/icons-material/Palette'
import NavigationIcon from '@mui/icons-material/Navigation'
import DownloadIcon from '@mui/icons-material/Download'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import DeleteIcon from '@mui/icons-material/Delete'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import SaveIcon from '@mui/icons-material/Save'
import { useSnackbar } from '../theme/SnackbarContext'
import { useColorMode } from '../theme/ColorModeContext'

interface SettingsPageProps {
  onBack: () => void
}

const SECTIONS = [
  { key: 'theme', icon: <PaletteIcon />, title: 'Apariencia' },
  { key: 'nav', icon: <NavigationIcon />, title: 'Navegación' },
  { key: 'download', icon: <DownloadIcon />, title: 'Descargas' },
  { key: 'telemetry', icon: <AnalyticsIcon />, title: 'Telemetría' },
  { key: 'advanced', icon: <SettingsSuggestIcon />, title: 'Avanzado' },
] as const

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [downloadPath, setDownloadPath] = useState('')
  const [batchSize, setBatchSize] = useState(50)
  const [defaultTab, setDefaultTab] = useState<'created' | 'active' | 'archived'>('created')
  const [excludedTags, setExcludedTags] = useState<string[]>([])
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [telemetryEnabled, setTelemetryEnabled] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showSnackbar } = useSnackbar()
  const { setMode } = useColorMode()

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
      setBatchSize(s.batchSize ?? 50)
      setDefaultTab(s.defaultTab ?? 'created')
      if (s.excludedFromMedia) setExcludedTags(s.excludedFromMedia)
      setThemeMode(s.themeMode ?? 'light')
      setTelemetryEnabled(s.telemetryEnabled ?? false)
      setLoaded(true)
    })
  }, [])

  const handleSelectFolder = async () => {
    const path = await window.telegramAPI.selectFolder()
    if (path) setDownloadPath(path)
  }

  const handleExportTelemetry = async () => {
    try {
      const json = await window.telegramAPI.exportTelemetry()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = url
        a.download = `telestorage-telemetry-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
      } finally {
        URL.revokeObjectURL(url)
      }
      showSnackbar('Telemetry exported', 'success')
    } catch {
      showSnackbar('Failed to export telemetry', 'error')
    }
  }

  const handleClearTelemetry = async () => {
    if (!window.confirm('Delete all locally stored telemetry data? This cannot be undone.')) return
    try {
      await window.telegramAPI.clearTelemetry()
      showSnackbar('Telemetry cleared', 'success')
    } catch {
      showSnackbar('Failed to clear telemetry', 'error')
    }
  }

  const handleOpenCrashesFolder = async () => {
    try {
      await window.telegramAPI.openCrashesFolder()
    } catch {
      showSnackbar('Failed to open crashes folder', 'error')
    }
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
        telemetryEnabled,
      })
      setMode(themeMode)
      showSnackbar('Configuración guardada', 'success')
    } catch {
      showSnackbar('No se pudo guardar la configuración', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 520, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.3px' }}>Configuración</Typography>
      <Paper variant="outlined" sx={{ borderRadius: 2, p: { xs: 2, sm: 3 } }}>
        {!loaded ? (
          <Fade in timeout={300}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[1, 2, 3].map(i => (
                <Box key={i}>
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="rounded" height={40} sx={{ mt: 0.5 }} />
                </Box>
              ))}
            </Box>
          </Fade>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {SECTIONS.map((section) => (
              <Box key={section.key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>{section.icon}</Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{section.title}</Typography>
                </Box>

                {section.key === 'theme' && (
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="theme-label">Tema</InputLabel>
                    <Select value={themeMode} label="Tema" labelId="theme-label" id="theme-select"
                      onChange={e => setThemeMode(e.target.value as 'light' | 'dark')}>
                      <MenuItem value="light">Claro</MenuItem>
                      <MenuItem value="dark">Oscuro</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {section.key === 'nav' && (
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="default-tab-label">Pestaña inicial</InputLabel>
                    <Select value={defaultTab} label="Pestaña inicial" labelId="default-tab-label" id="default-tab-select"
                      onChange={e => setDefaultTab(e.target.value as 'created' | 'active' | 'archived')}>
                      <MenuItem value="created">TeleStorage</MenuItem>
                      <MenuItem value="active">Activos</MenuItem>
                      <MenuItem value="archived">Archivados</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {section.key === 'download' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Carpeta de descargas</Typography>
                      <TextField data-testid="download-path-field" fullWidth size="small" value={downloadPath} slotProps={{
                        input: {
                          readOnly: true,
                          endAdornment: <Button size="small" onClick={handleSelectFolder} startIcon={<FolderIcon />}>Seleccionar carpeta</Button>
                        }
                      }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Archivos por carga</Typography>
                      <TextField data-testid="batch-size-input" type="number" size="small" sx={{ width: 120 }}
                        value={batchSize} onChange={e => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))} />
                    </Box>
                  </Box>
                )}

                {section.key === 'telemetry' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={telemetryEnabled}
                          onChange={e => setTelemetryEnabled(e.target.checked)}
                        />
                      }
                      label="Ayuda a mejorar TeleStorage compartiendo datos de uso"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Los datos de uso se almacenan localmente y nunca se cargan automáticamente.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportTelemetry}
                        disabled={!telemetryEnabled}
                      >
                        Exportar telemetría
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleClearTelemetry}
                      >
                        Borrar telemetría
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FolderOpenIcon />}
                        onClick={handleOpenCrashesFolder}
                      >
                        Abrir carpeta de fallos
                      </Button>
                    </Box>
                  </Box>
                )}

                {section.key === 'advanced' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Extensiones excluidas de multimedia</Typography>
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
                          <TextField {...params} size="small" placeholder="Ej: svg, webp, bmp" />
                        )}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Estas extensiones se tratarán como documentos y no aparecerán en Multimedia ni Galería.
                      </Typography>
                    </Box>
                    <Box>
                      <Button size="small" variant="outlined" color="warning" startIcon={<DescriptionIcon />} onClick={() => window.telegramAPI.openLogFolder()}>
                        Abrir carpeta de registros
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            ))}

            <Button variant="contained" onClick={handleSave} disabled={saving} endIcon={saving ? undefined : <SaveIcon />}
              sx={{ alignSelf: 'flex-start', mt: 1, px: 3 }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
