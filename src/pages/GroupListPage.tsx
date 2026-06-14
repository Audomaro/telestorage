import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
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
  const [isForumGroup, setIsForumGroup] = useState(false)
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
      await window.telegramAPI.createGroup(newGroupName.trim(), isForumGroup)
      setShowCreateDialog(false)
      setNewGroupName('')
      loadGroups()
    } catch (err: any) {
      showSnackbar(err.message || 'Error al crear grupo', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleRename = useCallback(async (group: TelegramGroup, newTitle: string) => {
    try {
      await window.telegramAPI.renameGroup(group.id, newTitle)
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, title: newTitle } : g))
      setArchived(prev => prev.map(g => g.id === group.id ? { ...g, title: newTitle } : g))
      showSnackbar('Grupo renombrado correctamente', 'success')
    } catch (err: any) {
      showSnackbar(err.message || 'Error al renombrar grupo', 'error')
    }
  }, [showSnackbar])

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
          <Box key={i} data-testid="skeleton-loader" sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
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
    <Box component="main" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 1 }}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="TeleStorage" data-testid="tab-telestorage" />
          <Tab label="Activos" data-testid="tab-activos" />
          <Tab label="Archivados" data-testid="tab-archivados" />
        </Tabs>
      </Box>
      {tab === 'created' && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button data-testid="btn-vincular" size="small" variant="outlined" startIcon={<LinkIcon />}
            onClick={() => setShowAddExistingDialog(true)}>
            Vincular propio
          </Button>
          <Button data-testid="btn-nuevo-grupo" size="small" variant="contained" color="warning" startIcon={<AddIcon />}
            onClick={() => { setShowCreateDialog(true); setTimeout(() => createInputRef.current?.focus(), 50) }}>
            Nuevo grupo
          </Button>
        </Box>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mt: 1 }}>
          {error}
        </Alert>
      )}
      <Box component="nav" aria-label="Grupos" sx={{
        mx: 2, mb: 2, p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1, borderColor: 'divider',
      }}>
        {visibleGroups.map(g => (
          <GroupListItem key={g.id} group={g} onClick={(grp) => onSelectGroup?.(grp)} onDelete={(grp) => setDeletingGroup(grp)} onRename={tab !== 'archived' ? handleRename : undefined} />
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

      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo grupo</DialogTitle>
        <DialogContent>
          <TextField inputRef={createInputRef} placeholder="Nombre del grupo" fullWidth sx={{ mt: 1 }}
            value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirmCreate() }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tipo de grupo</InputLabel>
            <Select value={isForumGroup ? 'forum' : 'simple'} label="Tipo de grupo"
              onChange={e => setIsForumGroup(e.target.value === 'forum')}>
              <MenuItem value="simple">Grupo simple</MenuItem>
              <MenuItem value="forum">Grupo foro</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmCreate} variant="contained" disabled={creating || !newGroupName.trim()}>
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAddExistingDialog} onClose={() => { setShowAddExistingDialog(false); setSelectedAddGroup(null); setAddGroupSearch('') }} maxWidth="xs" fullWidth>
        <DialogTitle>Vincular grupo propio</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Selecciona un grupo propio para agregarlo a TeleStorage
          </DialogContentText>
          <TextField
            data-testid="vincular-search-input"
            size="small"
            placeholder="Buscar grupo..."
            fullWidth
            value={addGroupSearch}
            onChange={e => setAddGroupSearch(e.target.value)}
          />
          <Box sx={{ maxHeight: 240, overflowY: 'auto', mt: 1 }}>
            {filteredOwnGroups.map(g => (
              <Box key={g.id} onClick={() => setSelectedAddGroup(g)}
                sx={{
                  p: 1.5, cursor: 'pointer', borderRadius: 1,
                  bgcolor: selectedAddGroup?.id === g.id ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 200ms',
                }}>
                <Typography variant="body2" sx={{ fontWeight: selectedAddGroup?.id === g.id ? 700 : 400 }}>
                  {g.title}
                </Typography>
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

      <Dialog open={!!deletingGroup} onClose={() => setDeletingGroup(null)} maxWidth="xs" fullWidth>
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
