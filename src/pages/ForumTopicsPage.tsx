import { useState, useEffect, useCallback, useRef } from 'react'
import { useSnackbar } from '../theme/SnackbarContext'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Fade from '@mui/material/Fade'
import AddIcon from '@mui/icons-material/Add'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import { TelegramGroup, ForumTopic } from '../types'
import ForumTopicListItem from '../components/ForumTopicListItem'
import EmptyState from '../components/EmptyState'

interface ForumTopicsPageProps {
  group: TelegramGroup
  onSelectTopic: (topic: ForumTopic) => void
  onBack: () => void
}

export default function ForumTopicsPage({ group, onSelectTopic, onBack }: ForumTopicsPageProps) {
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [creating, setCreating] = useState(false)
  const createInputRef = useRef<HTMLInputElement>(null)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true)
      setError('')
      try {
        const t = await window.telegramAPI.getForumTopics(group.id)
        setTopics(t)
      } catch (err: any) {
        setError(err.message || 'Error al cargar temas')
      } finally {
        setLoading(false)
      }
    }
    loadTopics()
  }, [group.id])

  const handleRename = useCallback(async (topic: ForumTopic, newTitle: string) => {
    try {
      await window.telegramAPI.renameTopic(group.id, topic.id, newTitle)
      setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, title: newTitle } : t))
      showSnackbar('Tema renombrado correctamente', 'success')
    } catch (err: any) {
      showSnackbar(err.message || 'Error al renombrar tema', 'error')
    }
  }, [group.id, showSnackbar])

  const handleDeleteTopic = useCallback(async (topic: ForumTopic) => {
    try {
      await window.telegramAPI.deleteTopic(group.id, topic.id)
      setTopics(prev => prev.filter(t => t.id !== topic.id))
      showSnackbar('Tema eliminado correctamente', 'success')
    } catch (err: any) {
      showSnackbar(err.message || 'Error al eliminar tema', 'error')
    }
  }, [group.id, showSnackbar])

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || creating) return
    setCreating(true)
    try {
      await window.telegramAPI.createTopic(group.id, newTopicName.trim())
      setShowCreateDialog(false)
      setNewTopicName('')
      const t = await window.telegramAPI.getForumTopics(group.id)
      setTopics(t)
      showSnackbar('Tema creado correctamente', 'success')
    } catch (err: any) {
      showSnackbar(err.message || 'Error al crear tema', 'error')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <Fade in timeout={300}>
        <Box sx={{ px: 2, pt: 2, pb: 2 }}>
          <Box sx={{ mb: 1 }}>
            <Skeleton variant="text" width="30%" animation="wave" />
          </Box>
          {[1, 2, 3].map(i => (
            <Box key={i} data-testid="skeleton-loader" sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Skeleton variant="circular" width={40} height={40} animation="wave" />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" animation="wave" />
                <Skeleton variant="text" width="30%" animation="wave" />
              </Box>
            </Box>
          ))}
        </Box>
      </Fade>
    )
  }

  return (
    <Box component="main" sx={{ px: 2, pt: 2, pb: 2, bgcolor: 'background.default', minHeight: '100%' }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}
      {group.isOwner && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
          <Button size="small" variant="contained" color="warning" startIcon={<AddIcon />}
            onClick={() => { setShowCreateDialog(true); setTimeout(() => createInputRef.current?.focus(), 50) }}>
            Crear tema
          </Button>
        </Box>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {topics.map(t => (
          <ForumTopicListItem key={t.id} topic={t} onClick={(topic) => onSelectTopic(topic)} onRename={handleRename} canRename={group.isOwner} onDelete={handleDeleteTopic} />
        ))}
        {topics.length === 0 && !error && (
          <EmptyState icon={<FolderOffIcon />} title="No hay temas en este forum" />
        )}
      </Box>

      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Crear tema</DialogTitle>
        <DialogContent>
          <TextField inputRef={createInputRef} placeholder="Nombre del tema" fullWidth sx={{ mt: 1 }}
            value={newTopicName} onChange={e => setNewTopicName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateTopic() }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateTopic} variant="contained" disabled={creating || !newTopicName.trim()}>
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
