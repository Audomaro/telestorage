import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FolderIcon from '@mui/icons-material/Folder'
import { useSnackbar } from '../theme/SnackbarContext'

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [downloadPath, setDownloadPath] = useState('')
  const [batchSize, setBatchSize] = useState(50)
  const [defaultTab, setDefaultTab] = useState<'created' | 'active' | 'archived'>('created')
  const [saving, setSaving] = useState(false)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
      setBatchSize(s.batchSize ?? 50)
      setDefaultTab(s.defaultTab ?? 'created')
    })
  }, [])

  const handleSelectFolder = async () => {
    const path = await window.telegramAPI.selectFolder()
    if (path) setDownloadPath(path)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.telegramAPI.setSettings({ downloadPath, batchSize, defaultTab })
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
        <Box>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Pestaña por defecto al iniciar</InputLabel>
            <Select value={defaultTab} label="Pestaña por defecto al iniciar"
              onChange={e => setDefaultTab(e.target.value as 'created' | 'active' | 'archived')}>
              <MenuItem value="created">TeleStorage</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="archived">Archivados</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </Box>
    </Box>
  )
}
