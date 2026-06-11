import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import GroupListPage from './pages/GroupListPage'
import GroupFilesPage from './pages/GroupFilesPage'
import SettingsPage from './pages/SettingsPage'
import { TelegramGroup } from './types'
import styles from './App.module.css'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    window.telegramAPI.init().then((result) => {
      setIsLoggedIn(result.initialized)
      setChecking(false)
    }).catch(() => {
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div className={styles.loading}>
        Conectando...
      </div>
    )
  }

  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />
  }

  if (selectedGroup) {
    return (
      <GroupFilesPage
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onSettings={() => setShowSettings(true)}
      />
    )
  }

  return <GroupListPage onSelectGroup={setSelectedGroup} onSettings={() => setShowSettings(true)} />
}
