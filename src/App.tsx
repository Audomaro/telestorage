import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import LoginPage from './pages/LoginPage'
import GroupListPage from './pages/GroupListPage'
import GroupFilesPage from './pages/GroupFilesPage'
import SettingsPage from './pages/SettingsPage'
import { TelegramGroup } from './types'
import { ColorModeProvider, useColorMode } from './theme/ColorModeContext'
import { SnackbarProvider } from './theme/SnackbarContext'
import { DownloadProvider } from './theme/DownloadContext'
import DownloadPanel from './components/DownloadPanel'

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null)
  const [showSettings, setShowSettings] = useState(false)
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
    else if (selectedGroup) setSelectedGroup(null)
  }

  const showBack = showSettings || !!selectedGroup

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
              {selectedGroup ? selectedGroup.title : 'TeleStorage'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton color="inherit" onClick={toggleColorMode} aria-label={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton color="inherit" onClick={() => setShowSettings(true)} aria-label="Configuración">
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', overscrollBehavior: 'contain' }}>
          {!isLoggedIn
            ? <LoginPage onLogin={() => setIsLoggedIn(true)} />
            : showSettings
              ? <SettingsPage onBack={() => setShowSettings(false)} />
              : selectedGroup
                ? <GroupFilesPage group={selectedGroup} onBack={() => setSelectedGroup(null)}
                    onSettings={() => setShowSettings(true)} />
                : <GroupListPage onSelectGroup={setSelectedGroup} onSettings={() => setShowSettings(true)} />
          }
        </Box>
        <DownloadPanel />
      </Box>
    </Box>
  )
}

export default function App() {
  return (
    <ColorModeProvider>
      <SnackbarProvider>
        <DownloadProvider>
          <AppContent />
        </DownloadProvider>
      </SnackbarProvider>
    </ColorModeProvider>
  )
}
