import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import DownloadIcon from '@mui/icons-material/Download'
import LogoutIcon from '@mui/icons-material/Logout'
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'text.secondary' }}>
        Conectando...
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isLoggedIn && (
        <AppBar position="sticky" elevation={1}>
          <Toolbar variant="dense">
            {showBack && (
              <IconButton color="inherit" edge="start" onClick={handleBack} aria-label="Volver">
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 0, mr: 2 }} noWrap>
              {selectedTopic ? selectedTopic.title : selectedGroup ? selectedGroup.title : 'TeleStorage'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton color="inherit" onClick={toggleColorMode} aria-label={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton color="inherit" onClick={() => setShowDownloads(prev => !prev)} aria-label="Descargas">
              <DownloadIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setShowSettings(true)} aria-label="Configuración">
              <SettingsIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setConfirmLogout(true)} aria-label="Cerrar sesión">
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={(theme) => ({ flex: 1, minWidth: 0, overflow: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', bgcolor: mode === 'dark' ? '#0F172A' : '#F0F6FA' })}>
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
      {showDownloads && (
        <Box sx={{ flexShrink: 0 }}>
          <TransferPanel />
        </Box>
      )}
      </Box>

      <Dialog open={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <DialogTitle>Cerrar sesión</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres cerrar sesión? Se eliminará la sesión actual y tendrás que iniciar sesión de nuevo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogout(false)}>Cancelar</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
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
