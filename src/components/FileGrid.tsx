import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import { TelegramFile } from '../types'

interface FileGridProps {
  files: TelegramFile[]
  selectMode: boolean
  selectedIds: Set<number>
  onPreview: (file: TelegramFile) => void
  onToggleSelect: (file: TelegramFile) => void
}

export default function FileGrid({ files, selectMode, selectedIds, onPreview, onToggleSelect }: FileGridProps) {
  if (files.length === 0) {
    return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin archivos multimedia</Typography>
  }

  const handleClick = (f: TelegramFile) => {
    if (selectMode) onToggleSelect(f)
    else onPreview(f)
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, p: 1 }}>
      {files.map(f => (
        <GridCard key={f.messageId} file={f} selectMode={selectMode} selected={selectedIds.has(f.messageId)} onClick={() => handleClick(f)} />
      ))}
    </Box>
  )
}

function gradientForMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  if (mimeType.startsWith('video/')) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
}

function GridCard({ file, selectMode, selected, onClick }: { file: TelegramFile; selectMode: boolean; selected: boolean; onClick: () => void }) {
  const imgRef = useRef<HTMLDivElement>(null)
  const [thumbnail, setThumbnail] = useState('')

  useEffect(() => {
    if (selectMode) return
    const el = imgRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          window.telegramAPI.downloadThumbnail(file.groupId, file.messageId).then(url => {
            if (url) setThumbnail(url)
          })
          obs.disconnect()
        }
      })
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [file.groupId, file.messageId, selectMode])

  return (
    <Box
      ref={imgRef}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      role="button"
      tabIndex={0}
      aria-label={file.name}
      sx={{
        position: 'relative', aspectRatio: '1', borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
        background: thumbnail ? 'none' : gradientForMime(file.mimeType), backgroundSize: 'cover',
        outline: selected ? '3px solid' : 'none',
        outlineColor: 'primary.main',
        '&:hover': { opacity: 0.85 },
      }}
    >
      {thumbnail && (
        <Box component="img" src={thumbnail} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {selectMode && (
        <Checkbox
          checked={selected}
          sx={{ position: 'absolute', top: 4, left: 4, color: 'white', '&.Mui-checked': { color: 'primary.main' } }}
        />
      )}
      {file.mimeType.startsWith('video/') && !selectMode && (
        <IconButton sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
          <PlayCircleIcon fontSize="large" />
        </IconButton>
      )}
    </Box>
  )
}
