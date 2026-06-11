import { useState, useEffect } from 'react'
import { TelegramGroup } from '../types'
import GroupListItem from '../components/GroupListItem'
import ConfirmDialog from '../components/ConfirmDialog'
import styles from './GroupListPage.module.css'

interface GroupListPageProps {
  onSelectGroup?: (group: TelegramGroup) => void
  onSettings?: () => void
}

export default function GroupListPage({ onSelectGroup, onSettings }: GroupListPageProps) {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [archived, setArchived] = useState<TelegramGroup[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingGroup, setDeletingGroup] = useState<TelegramGroup | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setLoading(true)
    setError('')
    try {
      const g = await window.telegramAPI.getGroups()
      setGroups(g)
    } catch (err: any) {
      setError(err.message || 'Error al cargar grupos')
    } finally {
      setLoading(false)
    }
  }

  const loadArchived = async () => {
    if (archived.length > 0) return
    setArchivedLoading(true)
    try {
      const a = await window.telegramAPI.getArchivedGroups()
      setArchived(a)
    } catch (err: any) {
      setError(err.message || 'Error al cargar grupos archivados')
    } finally {
      setArchivedLoading(false)
    }
  }

  const handleTabChange = (archived: boolean) => {
    setShowArchived(archived)
    if (archived) loadArchived()
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

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return
    setDeleting(true)
    try {
      await window.telegramAPI.deleteGroup(deletingGroup.id)
      setDeletingGroup(null)
      loadGroups()
      setArchived(prev => prev.filter(g => g.id !== deletingGroup.id))
    } catch (err: any) {
      alert(err.message || 'Error al eliminar grupo')
    } finally {
      setDeleting(false)
    }
  }

  const displayGroups = showArchived ? archived : groups

  if (loading) {
    return (
      <div className={styles.loading}>Cargando grupos...</div>
    )
  }

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Grupos</h2>
        <div className={styles.actions}>
          {onSettings && (
            <button onClick={onSettings} title="Configuración" className={styles.settingsBtn}>⚙️</button>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => handleTabChange(false)}
              className={`${styles.tab} ${!showArchived ? styles.tabActive : ''}`}>Activos</button>
            <button onClick={() => handleTabChange(true)}
              className={`${styles.tab} ${showArchived ? styles.tabActive : ''}`}>Archivados</button>
          </div>
          <button onClick={handleCreateGroup} className={styles.createBtn}>+ Nuevo grupo</button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {displayGroups.map(g => (
        <GroupListItem
          key={g.id}
          group={g}
          onClick={(group) => onSelectGroup?.(group)}
          onDelete={(group) => setDeletingGroup(group)}
        />
      ))}

      {displayGroups.length === 0 && !archivedLoading && (
        <div className={styles.empty}>
          {showArchived ? 'No hay grupos archivados' : 'No hay grupos. Crea uno nuevo con "+ Nuevo grupo".'}
        </div>
      )}

      {showArchived && archivedLoading && (
        <div className={styles.loading}>Cargando grupos archivados...</div>
      )}

      {deletingGroup && (
        <ConfirmDialog
          title="Eliminar grupo"
          message={`¿Estás seguro de eliminar "${deletingGroup.title}"? Los archivos no se podrán recuperar.`}
          confirmLabel="Eliminar grupo"
          loading={deleting}
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeletingGroup(null)}
        />
      )}
    </div>
  )
}
