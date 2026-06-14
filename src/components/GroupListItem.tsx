import { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GroupIcon from '@mui/icons-material/Group'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { TelegramGroup } from '../types'

interface GroupListItemProps {
  group: TelegramGroup
  onClick: (group: TelegramGroup) => void
  onDelete?: (group: TelegramGroup) => void
  onRename?: (group: TelegramGroup, newTitle: string) => void
}

function getInitials(title: string): string {
  return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function GroupListItem({ group, onClick, onDelete, onRename }: GroupListItemProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTitle, setRenameTitle] = useState(group.title)
  return (
    <>
    <Paper data-testid="group-list-item" elevation={0} onClick={() => onClick(group)}
      sx={{
        mb: 1,
        borderRadius: 2,
        cursor: 'pointer',
        bgcolor: 'background.paper',
        border: 1, borderColor: 'divider',
        transition: 'all 200ms',
        '&:hover': {
          boxShadow: (t) => t.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,136,204,0.15)',
          transform: 'translateY(-2px)',
          borderColor: 'primary.main',
        }
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Avatar sx={{ bgcolor: group.isOwner ? 'primary.main' : '#FF9800', width: 40, height: 40, fontSize: 16 }}>
          {getInitials(group.title)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 700 }}>{group.title}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={group.isOwner ? 'Propio' : 'Tercero'}
              color={group.isOwner ? 'primary' : 'warning'}
              size="small"
              icon={group.isOwner ? <CheckCircleIcon /> : <GroupIcon />}
            />
            {group.isForum && (
              <Chip label="Forum" size="small" data-testid="forum-badge" color="primary" />
            )}
            {!group.isOwner && (
              <Chip label="Solo lectura" variant="outlined" size="small" />
            )}
            {group.isArchived && (
              <Chip label="Archivado" variant="outlined" size="small" />
            )}
          </Box>
        </Box>
        {onRename && group.isOwner && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); setRenameTitle(group.title); setRenameOpen(true) }} aria-label="Renombrar grupo">
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {onDelete && group.isOwner && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); onDelete(group) }} aria-label="Eliminar grupo">
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </CardContent>
    </Paper>
    <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Renombrar grupo</DialogTitle>
      <DialogContent>
        <TextField fullWidth autoFocus value={renameTitle} onChange={e => setRenameTitle(e.target.value)} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRenameOpen(false)}>Cancelar</Button>
        <Button variant="contained" onClick={() => { onRename?.(group, renameTitle); setRenameOpen(false) }}>Guardar</Button>
      </DialogActions>
    </Dialog>
    </>
  )
}
