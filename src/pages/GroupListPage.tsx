import { useState, useEffect } from 'react'
import { TelegramGroup } from '../types'
import GroupListItem from '../components/GroupListItem'

interface GroupListPageProps {
  onSelectGroup?: (group: TelegramGroup) => void
}

export default function GroupListPage({ onSelectGroup }: GroupListPageProps) {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [archived, setArchived] = useState<TelegramGroup[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setLoading(true)
    setError('')
    try {
      const [g, a] = await Promise.all([
        window.telegramAPI.getGroups(),
        window.telegramAPI.getArchivedGroups()
      ])
      setGroups(g)
      setArchived(a)
    } catch (err: any) {
      setError(err.message || 'Error al cargar grupos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    const title = prompt('Nombre del nuevo grupo:')
    if (!title || !title.trim()) return
    try {
      await window.telegramAPI.createGroup(title.trim())
      loadGroups()
    } catch (err: any) {
      alert(err.message || 'Error al crear grupo')
    }
  }

  const displayGroups = showArchived ? archived : groups

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>
        Cargando grupos...
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>Grupos</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowArchived(!showArchived)}
            style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc',
              background: '#fff', cursor: 'pointer', fontSize: 12, color: '#555'
            }}>
            {showArchived ? 'Activos' : 'Archivados'}
          </button>
          <button onClick={handleCreateGroup}
            style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: '#4CAF50', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}>
            + Nuevo grupo
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, color: '#d32f2f', background: '#FFEBEE', fontSize: 14 }}>
          {error}
        </div>
      )}

      {displayGroups.map(g => (
        <GroupListItem
          key={g.id}
          group={g}
          onClick={(group) => onSelectGroup?.(group)}
        />
      ))}

      {displayGroups.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: '#888', fontSize: 14 }}>
          {showArchived ? 'No hay grupos archivados' : 'No hay grupos. Crea uno nuevo con "+ Nuevo grupo".'}
        </div>
      )}
    </div>
  )
}
