import { useState, useEffect, useRef } from 'react'
import { TelegramGroup } from '../types'
import GroupListItem from '../components/GroupListItem'
import ConfirmDialog from '../components/ConfirmDialog'
import styles from './GroupListPage.module.css'

const TAB_KEY = 'telestorage:groupTab'

function loadSavedTab(): 'created' | 'active' | 'archived' {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    if (saved === 'created' || saved === 'active' || saved === 'archived') return saved
  } catch {}
  return 'created'
}

function saveTab(tab: 'created' | 'active' | 'archived') {
  try { localStorage.setItem(TAB_KEY, tab) } catch {}
}

interface GroupListPageProps {
  onSelectGroup?: (group: TelegramGroup) => void
  onSettings?: () => void
}

export default function GroupListPage({ onSelectGroup, onSettings }: GroupListPageProps) {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [archived, setArchived] = useState<TelegramGroup[]>([])
  const [tab, setTab] = useState<'created' | 'active' | 'archived'>(loadSavedTab)
  const [loading, setLoading] = useState(true)
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingGroup, setDeletingGroup] = useState<TelegramGroup | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const createInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadGroups()
    if (tab === 'archived') loadArchived()
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

  const handleTabChange = (newTab: 'created' | 'active' | 'archived') => {
    setTab(newTab)
    saveTab(newTab)
    if (newTab === 'archived') {
      loadArchived()
    } else {
      loadGroups()
    }
  }

  const handleCreateGroup = async () => {
    setNewGroupName('')
    setShowCreateDialog(true)
    setTimeout(() => createInputRef.current?.focus(), 50)
  }

  const handleConfirmCreate = async () => {
    if (!newGroupName.trim() || creating) return
    setCreating(true)
    try {
      await window.telegramAPI.createGroup(newGroupName.trim())
      setShowCreateDialog(false)
      setNewGroupName('')
      loadGroups()
    } catch (err: any) {
      alert(err.message || 'Error al crear grupo')
    } finally {
      setCreating(false)
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

  const allGroups = [...groups, ...archived]
  const visibleGroups = tab === 'created'
    ? allGroups.filter(g => g.isAppCreated && !g.isArchived)
    : tab === 'active'
      ? allGroups.filter(g => !g.isArchived)
      : allGroups.filter(g => g.isArchived)

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
            <button onClick={() => handleTabChange('created')}
              className={`${styles.tab} ${tab === 'created' ? styles.tabActive : ''}`}>Creados</button>
            <button onClick={() => handleTabChange('active')}
              className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`}>Activos</button>
            <button onClick={() => handleTabChange('archived')}
              className={`${styles.tab} ${tab === 'archived' ? styles.tabActive : ''}`}>Archivados</button>
          </div>
          <button onClick={handleCreateGroup} className={styles.createBtn}>+ Nuevo grupo</button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {visibleGroups.map(g => (
        <GroupListItem
          key={g.id}
          group={g}
          onClick={(group) => onSelectGroup?.(group)}
          onDelete={(group) => setDeletingGroup(group)}
        />
      ))}

      {visibleGroups.length === 0 && !archivedLoading && (
        <div className={styles.empty}>
          {tab === 'created' && 'No hay grupos creados con TeleStorage'}
          {tab === 'active' && 'No hay grupos. Crea uno nuevo con "+ Nuevo grupo".'}
          {tab === 'archived' && 'No hay grupos archivados'}
        </div>
      )}

      {tab === 'archived' && archivedLoading && (
        <div className={styles.loading}>Cargando grupos archivados...</div>
      )}

      {showCreateDialog && (
        <div className={styles.overlay} onClick={() => setShowCreateDialog(false)}>
          <div className={styles.createDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.createTitle}>Nuevo grupo</h3>
            <input
              ref={createInputRef}
              className={styles.createInput}
              placeholder="Nombre del grupo"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCreate() }}
            />
            <div className={styles.createActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreateDialog(false)}>Cancelar</button>
              <button className={styles.confirmBtn} onClick={handleConfirmCreate} disabled={creating || !newGroupName.trim()}>
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
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
