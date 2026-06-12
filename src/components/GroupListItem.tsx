import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
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
    <Card sx={{ mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => onClick(group)}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Avatar sx={{ bgcolor: group.isOwner ? 'primary.main' : '#FF9800', width: 40, height: 40, fontSize: 16 }}>
          {getInitials(group.title)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap>{group.title}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={group.isOwner ? 'Propio' : 'Tercero'}
              color={group.isOwner ? 'primary' : 'warning'}
              size="small"
              icon={group.isOwner ? <CheckCircleIcon /> : <GroupIcon />}
            />
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
    </Card>
  )
}
