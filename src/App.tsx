import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import { alpha } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import Slide from '@mui/material/Slide'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import DownloadIcon from '@mui/icons-material/Download'
import LogoutIcon from '@mui/icons-material/Logout'
import StorageIcon from '@mui/icons-material/Storage'
import LoginPage from './pages/LoginPage'
import GroupListPage from './pages/GroupListPage'
import GroupFilesPage from './pages/GroupFilesPage'
import ForumTopicsPage from './pages/ForumTopicsPage'
import SettingsPage from './pages/SettingsPage'
import { TelegramGroup, ForumTopic } from './types'
import { ColorModeProvider, useColorMode } from './theme/ColorModeContext'
import { SnackbarProvider } from './theme/SnackbarContext'
import { DownloadProvider } from './theme/DownloadContext'
import { UploadProvider } from './theme/UploadContext'
import TransferPanel from './components/TransferPanel'

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDownloads, setShowDownloads] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const { mode, toggleColorMode } = useColorMode()

  useEffect(() => {
    window.telegramAPI.init()
      .then((result) => { setIsLoggedIn(result.initialized); setChecking(false) })
      .catch(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 2, bgcolor: 'background.default'
      }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
        }}>
          <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        </Box>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">Conectando...</Typography>
      </Box>
    )
  }

  const handleBack = () => {
    if (showSettings) setShowSettings(false)
    else if (selectedTopic) setSelectedTopic(null)
    else if (selectedGroup) setSelectedGroup(null)
  }

  const showBack = showSettings || !!selectedTopic || !!selectedGroup

  const handleLogout = async () => {
    setConfirmLogout(false)
    await window.telegramAPI.logout()
    setIsLoggedIn(false)
    setSelectedGroup(null)
    setSelectedTopic(null)
    setShowSettings(false)
    setShowDownloads(false)
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {isLoggedIn && (
        <AppBar position="sticky" elevation={0} sx={{
          borderBottom: 1, borderColor: 'divider',
          backdropFilter: 'blur(12px)',
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
          color: 'text.primary',
        }}>
          <Toolbar variant="dense">
            <Fade in={showBack}>
              <Box>
                {showBack && (
                  <Tooltip title="Volver">
                    <IconButton color="inherit" edge="start" onClick={handleBack} aria-label="Volver" size="small">
                      <ArrowBackIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Fade>
            <Typography variant="h6" sx={{ flexGrow: 0, mr: 2, fontWeight: 700, letterSpacing: '-0.3px' }} noWrap>
              {selectedTopic ? selectedTopic.title : selectedGroup ? selectedGroup.title : 'TeleStorage'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title={mode === 'dark' ? 'Tema claro' : 'Tema oscuro'}>
              <IconButton color="inherit" onClick={toggleColorMode} size="small" aria-label={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Transferencias">
              <IconButton color="inherit" onClick={() => setShowDownloads(prev => !prev)} size="small" aria-label="Transferencias">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Configuración">
              <IconButton color="inherit" onClick={() => setShowSettings(true)} size="small" aria-label="Configuración">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cerrar sesión">
              <IconButton color="inherit" onClick={() => setConfirmLogout(true)} size="small" aria-label="Cerrar sesión">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', bgcolor: 'background.default' }}>
          {!isLoggedIn
            ? <LoginPage onLogin={() => setIsLoggedIn(true)} />
            : showSettings
              ? <SettingsPage onBack={() => setShowSettings(false)} />
              : selectedGroup?.isForum && !selectedTopic
                ? <ForumTopicsPage group={selectedGroup} onSelectTopic={setSelectedTopic} onBack={() => setSelectedGroup(null)} />
                : selectedGroup
                  ? <GroupFilesPage group={selectedGroup} topic={selectedTopic || undefined} onBack={() => selectedTopic ? setSelectedTopic(null) : setSelectedGroup(null)}
                      onSettings={() => setShowSettings(true)} />
                  : <GroupListPage onSelectGroup={setSelectedGroup} onSettings={() => setShowSettings(true)} />
          }
        </Box>
        <Slide direction="left" in={showDownloads} mountOnEnter unmountOnExit timeout={200}>
          <Box sx={{ flexShrink: 0, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
            <TransferPanel onClose={() => setShowDownloads(false)} />
          </Box>
        </Slide>
      </Box>

      <Dialog open={confirmLogout} onClose={() => setConfirmLogout(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cerrar sesión</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres cerrar sesión? Se eliminará la sesión actual y tendrás que iniciar sesión de nuevo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogout(false)}>Cancelar</Button>
          <Button onClick={handleLogout} color="error" variant="contained" endIcon={<LogoutIcon />}>
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function App() {
  return (
    <ColorModeProvider>
      <SnackbarProvider>
        <DownloadProvider>
          <UploadProvider>
            <AppContent />
          </UploadProvider>
        </DownloadProvider>
      </SnackbarProvider>
    </ColorModeProvider>
  )
}
