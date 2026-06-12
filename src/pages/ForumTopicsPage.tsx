import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
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

  if (loading) {
    return (
      <Box component="main" sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width="40%" />
        </Box>
        <Box sx={{ mb: 1 }}>
          <Skeleton variant="text" width="30%" />
        </Box>
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
    <Box component="main">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 2 }}>
        <IconButton onClick={onBack} aria-label="Volver">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6" noWrap>{group.title}</Typography>
          <Typography variant="body2" color="text.secondary">Temas del forum</Typography>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ px: 2, pt: 2 }}>
        {topics.map(t => (
          <ForumTopicListItem key={t.id} topic={t} onClick={(topic) => onSelectTopic(topic)} />
        ))}
        {topics.length === 0 && !error && (
          <EmptyState icon={<FolderOffIcon />} title="No hay temas en este forum" />
        )}
      </Box>
    </Box>
  )
}
