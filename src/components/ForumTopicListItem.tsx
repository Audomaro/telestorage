import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
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
  onRename?: (topic: ForumTopic, newTitle: string) => void
  canRename?: boolean
  onDelete?: (topic: ForumTopic) => void
}

export default function ForumTopicListItem({ topic, onClick, onRename, canRename, onDelete }: Props) {
  const color = TOPIC_COLORS[topic.iconColor] ?? TOPIC_COLORS[0]
  const initial = topic.title.charAt(0).toUpperCase()
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTitle, setRenameTitle] = useState(topic.title)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  return (
    <>
    <Card
      data-testid="forum-topic-list-item"
      sx={{ cursor: 'pointer', borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', transition: 'all 200ms', '&:hover': { boxShadow: (t) => t.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,136,204,0.15)', transform: 'translateY(-2px)', borderColor: 'primary.main' } }}
      onClick={() => onClick(topic)}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Avatar sx={{ bgcolor: color, width: 40, height: 40, fontSize: 16, color: '#fff', boxShadow: `0 2px 6px ${color}60` }}>
          {initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 700 }}>{topic.title}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip label="Tema" size="small" color="primary" variant="outlined" />
          </Box>
        </Box>
        {onRename && canRename && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); setRenameTitle(topic.title); setRenameOpen(true) }} aria-label="Renombrar tema">
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {onDelete && canRename && (
          <IconButton size="small" onClick={e => { e.stopPropagation(); setConfirmDeleteOpen(true) }} aria-label="Eliminar tema">
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </CardContent>
    </Card>
    <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Eliminar tema</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de eliminar "{topic.title}"? Los archivos de este tema se eliminarán permanentemente.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={() => { onDelete?.(topic); setConfirmDeleteOpen(false) }}>Eliminar</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Renombrar tema</DialogTitle>
      <DialogContent>
        <TextField fullWidth autoFocus value={renameTitle} onChange={e => setRenameTitle(e.target.value)} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRenameOpen(false)}>Cancelar</Button>
        <Button variant="contained" onClick={() => { onRename?.(topic, renameTitle); setRenameOpen(false) }}>Guardar</Button>
      </DialogActions>
    </Dialog>
    </>
  )
}
