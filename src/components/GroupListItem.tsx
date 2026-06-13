import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GroupIcon from '@mui/icons-material/Group'
import { TelegramGroup } from '../types'

interface GroupListItemProps {
  group: TelegramGroup
  onClick: (group: TelegramGroup) => void
  onDelete?: (group: TelegramGroup) => void
}

function getInitials(title: string): string {
  return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function GroupListItem({ group, onClick, onDelete }: GroupListItemProps) {
  return (
    <Paper data-testid="group-list-item" elevation={0} onClick={() => onClick(group)}
      sx={{
        mb: 1,
        borderRadius: '12px',
        cursor: 'pointer',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.7)' : '#F0F6FA',
        backdropFilter: 'blur(10px)',
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,136,204,0.15)'}`,
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? '0 4px 6px -1px rgba(0,0,0,0.3)'
          : '0 4px 6px -1px rgba(0,136,204,0.1)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 10px 15px -3px rgba(0,0,0,0.4)'
            : '0 10px 15px -3px rgba(0,136,204,0.15)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Avatar sx={{ bgcolor: group.isOwner ? 'primary.main' : '#FF9800', width: 40, height: 40, fontSize: 16 }}>
          {getInitials(group.title)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#E2E8F0' : '#222222' }}>{group.title}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={group.isOwner ? 'Propio' : 'Tercero'}
              color={group.isOwner ? 'primary' : 'warning'}
              size="small"
              icon={group.isOwner ? <CheckCircleIcon /> : <GroupIcon />}
            />
            {group.isForum && (
              <Chip label="Forum" size="small" data-testid="forum-badge"
                sx={{ bgcolor: '#0088cc', color: '#fff', fontWeight: 600 }} />
            )}
            {!group.isOwner && (
              <Chip label="Solo lectura" variant="outlined" size="small" />
            )}
            {group.isArchived && (
              <Chip label="Archivado" variant="outlined" size="small" />
            )}
          </Box>
        </Box>
        {onDelete && group.isOwner && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); onDelete(group) }} aria-label="Eliminar grupo">
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </CardContent>
    </Paper>
  )
}
