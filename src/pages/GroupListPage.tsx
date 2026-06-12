import { useState, useEffect, useRef, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import LinkIcon from '@mui/icons-material/Link'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import { TelegramGroup } from '../types'
import GroupListItem from '../components/GroupListItem'
import EmptyState from '../components/EmptyState'
import { useSnackbar } from '../theme/SnackbarContext'

const TAB_KEY = 'telestorage:groupTab'
let _sessionFirstMount = true

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
  const [showAddExistingDialog, setShowAddExistingDialog] = useState(false)
  const [selectedAddGroup, setSelectedAddGroup] = useState<TelegramGroup | null>(null)
  const [addingGroup, setAddingGroup] = useState(false)
  const [addGroupSearch, setAddGroupSearch] = useState('')
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    loadGroups()
    if (tab === 'archived') loadArchived()
  }, [])

  useEffect(() => {
    if (_sessionFirstMount) {
      _sessionFirstMount = false
      window.telegramAPI.getSettings().then(s => {
        const dt = s.defaultTab ?? 'created'
        setTab(dt)
        saveTab(dt)
        if (dt === 'archived') loadArchived()
      })
    }
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

  const handleTabChange = (_: any, newTab: number) => {
    const labels: ('created' | 'active' | 'archived')[] = ['created', 'active', 'archived']
    const t = labels[newTab]
    setTab(t)
    saveTab(t)
    if (t === 'archived') loadArchived()
    else loadGroups()
  }

  const handleConfirmAddExisting = async () => {
    if (!selectedAddGroup || addingGroup) return
    setAddingGroup(true)
    try {
      await window.telegramAPI.addToCreatedGroup(selectedAddGroup.id)
      setShowAddExistingDialog(false)
      setSelectedAddGroup(null)
      setAddGroupSearch('')
      loadGroups()
    } catch (err: any) {
      showSnackbar(err.message || 'Error al vincular grupo', 'error')
    } finally {
      setAddingGroup(false)
    }
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
      showSnackbar(err.message || 'Error al crear grupo', 'error')
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
      showSnackbar(err.message || 'Error al eliminar grupo', 'error')
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

  const tabIndex = tab === 'created' ? 0 : tab === 'active' ? 1 : 2

  const availableOwnGroups = useMemo(() => {
    return allGroups.filter(g => g.isOwner && !g.isAppCreated && !g.isArchived)
  }, [allGroups])

  const filteredOwnGroups = useMemo(() => {
    if (!addGroupSearch) return availableOwnGroups
    return availableOwnGroups.filter(g =>
      g.title.toLowerCase().includes(addGroupSearch.toLowerCase())
    )
  }, [availableOwnGroups, addGroupSearch])

  if (loading) {
    return (
      <Box sx={{ px: 2 }}>
        {[1, 2, 3].map(i => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="30%" />
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box component="main">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 1 }}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="TeleStorage" />
          <Tab label="Activos" />
          <Tab label="Archivados" />
        </Tabs>
      </Box>
      {tab === 'created' && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={() => setShowAddExistingDialog(true)}>
            Vincular propio
          </Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { setShowCreateDialog(true); setTimeout(() => createInputRef.current?.focus(), 50) }}>
            Nuevo grupo
          </Button>
        </Box>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mt: 1 }}>
          {error}
        </Alert>
      )}
      <Box component="nav" aria-label="Grupos" sx={{ px: 2 }}>
        {visibleGroups.map(g => (
          <GroupListItem key={g.id} group={g} onClick={(grp) => onSelectGroup?.(grp)} onDelete={(grp) => setDeletingGroup(grp)} />
        ))}
        {visibleGroups.length === 0 && !archivedLoading && (
          tab === 'created'
            ? <EmptyState icon={<FolderOffIcon />} title="No hay grupos en TeleStorage" />
            : tab === 'active'
              ? <EmptyState icon={<FolderOffIcon />} title="No hay grupos" subtitle="Crea uno nuevo en TeleStorage" />
              : <EmptyState icon={<FolderOffIcon />} title="No hay grupos archivados" />
        )}
        {tab === 'archived' && archivedLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Nuevo grupo</DialogTitle>
        <DialogContent>
          <TextField inputRef={createInputRef} placeholder="Nombre del grupo" fullWidth sx={{ mt: 1 }}
            value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirmCreate() }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmCreate} variant="contained" disabled={creating || !newGroupName.trim()}>
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAddExistingDialog} onClose={() => { setShowAddExistingDialog(false); setSelectedAddGroup(null); setAddGroupSearch('') }}>
        <DialogTitle>Vincular grupo propio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Selecciona un grupo propio para agregarlo a TeleStorage
          </DialogContentText>
          <TextField
            size="small"
            placeholder="Buscar grupo..."
            fullWidth
            value={addGroupSearch}
            onChange={e => setAddGroupSearch(e.target.value)}
            sx={{ mt: 1, mb: 1 }}
          />
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredOwnGroups.map(g => (
              <Box key={g.id} onClick={() => setSelectedAddGroup(g)}
                sx={{ p: 1, cursor: 'pointer', borderRadius: 1,
                  bgcolor: selectedAddGroup?.id === g.id ? 'action.selected' : 'transparent', mb: 0.5 }}>
                {g.title}
              </Box>
            ))}
            {filteredOwnGroups.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                {addGroupSearch ? 'Sin resultados' : 'No hay grupos propios sin vincular'}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddExistingDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAddExisting} variant="contained" disabled={!selectedAddGroup || addingGroup}>
            {addingGroup ? 'Vinculando...' : 'Vincular'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deletingGroup} onClose={() => setDeletingGroup(null)}>
        <DialogTitle>Eliminar grupo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de eliminar "{deletingGroup?.title}"? Los archivos no se podrán recuperar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingGroup(null)}>Cancelar</Button>
          <Button onClick={handleDeleteGroup} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar grupo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
