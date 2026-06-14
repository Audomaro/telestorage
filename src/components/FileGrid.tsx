import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ImageIcon from '@mui/icons-material/Image'
import MovieIcon from '@mui/icons-material/Movie'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import { TelegramFile } from '../types'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
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
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(auto-fill, minmax(140px, 1fr))',
        sm: 'repeat(auto-fill, minmax(180px, 1fr))',
        md: 'repeat(auto-fill, minmax(200px, 1fr))',
      },
      gap: { xs: 1, sm: 1.5, md: 2 },
      p: 2,
    }}>
      {files.map(f => (
        <GridCard key={f.messageId} file={f} selectMode={selectMode} selected={selectedIds.has(f.messageId)} onClick={() => handleClick(f)} />
      ))}
    </Box>
  )
}

function gradientForMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  if (mimeType.startsWith('video/')) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  if (mimeType === 'application/pdf') return 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
  if (mimeType.startsWith('audio/')) return 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
  return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
}

function fileTypeIcon(mimeType: string, sx: Record<string, unknown>) {
  if (mimeType.startsWith('image/')) return <ImageIcon sx={sx} />
  if (mimeType.startsWith('video/')) return <MovieIcon sx={sx} />
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon sx={sx} />
  if (mimeType.startsWith('audio/')) return <AudioFileIcon sx={sx} />
  return <InsertDriveFileIcon sx={sx} />
}

interface FileGridProps {
  files: TelegramFile[]
  selectMode: boolean
  selectedIds: Set<number>
  onPreview: (file: TelegramFile) => void
  onToggleSelect: (file: TelegramFile) => void
}

function GridCard({ file, selectMode, selected, onClick }: { file: TelegramFile; selectMode: boolean; selected: boolean; onClick: () => void }) {
  const imgRef = useRef<HTMLDivElement>(null)
  const [thumbnail, setThumbnail] = useState('')
  const [loaded, setLoaded] = useState(false)

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

  const ext = file.name.split('.').pop()?.toUpperCase() || file.mimeType.split('/').pop()?.toUpperCase() || ''

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box
        ref={imgRef}
        onClick={onClick}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
        role="button"
        tabIndex={0}
        aria-label={file.name}
        aria-selected={selected}
        data-testid="file-grid-item"
        sx={{
          position: 'relative',
          aspectRatio: '1',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          background: thumbnail ? 'none' : gradientForMime(file.mimeType),
          backgroundSize: 'cover',
          outline: selected ? '2px solid' : 'none',
          outlineColor: 'primary.main',
          outlineOffset: 2,
          transition: 'box-shadow 200ms, transform 200ms',
          '&:hover': {
            boxShadow: (t) => t.palette.mode === 'dark' ? '0 8px 25px rgba(0,0,0,0.4)' : '0 8px 25px rgba(0,136,204,0.15)',
            transform: 'translateY(-2px)',
            '& .file-overlay': { opacity: 1 },
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
          border: 1,
          borderColor: 'divider',
        }}
      >
        {thumbnail && (
          <Box
            component="img"
            src={thumbnail}
            onLoad={() => setLoaded(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 300ms',
            }}
          />
        )}
        {!thumbnail && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {fileTypeIcon(file.mimeType, { fontSize: 48, color: 'rgba(255,255,255,0.7)' })}
          </Box>
        )}
        {selectMode && (
          <Checkbox
            checked={selected}
            sx={{
              position: 'absolute',
              top: 6,
              left: 6,
              bgcolor: selected ? 'primary.main' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(4px)',
              borderRadius: 0.5,
              color: selected ? 'white' : 'primary.main',
              '&.Mui-checked': { color: 'white' },
              transition: 'all 200ms',
              p: 0.5,
              '& .MuiSvgIcon-root': { fontSize: 20 },
            }}
          />
        )}
        {file.mimeType.startsWith('video/') && !selectMode && (
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
              transition: 'background-color 200ms',
            }}
          >
            <PlayCircleIcon fontSize="large" />
          </IconButton>
        )}
        <Box
          className="file-overlay"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            opacity: 0,
            transition: 'opacity 200ms',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="caption" noWrap sx={{ color: 'white', fontWeight: 600, display: 'block' }}>
            {file.name}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: 0.5 }}>
        <Typography variant="caption" noWrap sx={{ fontWeight: 600, display: 'block' }}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {formatSize(file.size)} &middot; {formatDate(file.date)}
        </Typography>
      </Box>
    </Box>
  )
}
