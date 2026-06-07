import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import GroupListPage from './pages/GroupListPage'
import GroupFilesPage from './pages/GroupFilesPage'
import { TelegramGroup } from './types'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null)

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888', fontSize: 16 }}>
        Conectando...
      </div>
    )
  }

  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />

  if (selectedGroup) {
    return (
      <GroupFilesPage
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    )
  }

  return <GroupListPage onSelectGroup={setSelectedGroup} />
}
