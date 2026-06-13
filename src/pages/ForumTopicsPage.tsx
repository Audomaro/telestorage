import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
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
      <Box component="main" sx={{ px: 2, pt: 2, pb: 2, bgcolor: '#F0F6FA', minHeight: '100%' }}>
        <Box sx={{ mb: 1 }}>
          <Skeleton variant="text" width="30%" sx={{ bgcolor: 'rgba(0,136,204,0.1)' }} />
        </Box>
        {[1, 2, 3].map(i => (
          <Box key={i} data-testid="skeleton-loader" sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(0,136,204,0.15)' }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(0,136,204,0.1)' }} />
              <Skeleton variant="text" width="30%" sx={{ bgcolor: 'rgba(0,136,204,0.1)' }} />
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box component="main" sx={{ px: 2, pt: 2, pb: 2, bgcolor: '#F0F6FA', minHeight: '100%' }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
