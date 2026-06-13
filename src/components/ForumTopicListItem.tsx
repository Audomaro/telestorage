import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import { ForumTopic } from '../types'

const TOPIC_COLORS: Record<number, string> = {
  0: '#E17076',
  1: '#FAA774',
  2: '#FECD6E',
  3: '#A8D480',
  4: '#77C5E3',
  5: '#5FA3E1',
  6: '#A28FEF'
}

interface Props {
  topic: ForumTopic
  onClick: (topic: ForumTopic) => void
}

export default function ForumTopicListItem({ topic, onClick }: Props) {
  const color = TOPIC_COLORS[topic.iconColor] ?? TOPIC_COLORS[0]
  const initial = topic.title.charAt(0).toUpperCase()

  return (
    <Card
      data-testid="forum-topic-list-item"
      sx={{ cursor: 'pointer', borderRadius: '12px', bgcolor: '#F0F6FA', border: '1px solid rgba(0,136,204,0.1)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.2s ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } }}
      onClick={() => onClick(topic)}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Avatar sx={{ bgcolor: color, width: 40, height: 40, fontSize: 16, color: '#fff', boxShadow: `0 2px 6px ${color}60` }}>
          {initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 700, color: '#222222' }}>{topic.title}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip label="Tema" size="small" sx={{ bgcolor: 'rgba(0,136,204,0.1)', color: '#0088cc', fontWeight: 600 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
