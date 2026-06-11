import { useRef, useEffect, useState } from 'react'
import { TelegramFile } from '../types'
import { isMedia } from '../utils/fileTypes'
import styles from './FileGrid.module.css'

interface FileGridProps {
  files: TelegramFile[]
  groupId: number
  onPreview: (file: TelegramFile) => void
}

function getGradient(mimeType: string, index: number): string {
  const gradients: Record<string, [string, string]> = {
    'image/jpeg': ['#667eea', '#764ba2'],
    'image/png':  ['#f093fb', '#f5576c'],
    'image/gif':  ['#4facfe', '#00f2fe'],
    'video/mp4':  ['#43e97b', '#38f9d7'],
    'video/quicktime': ['#fa709a', '#fee140'],
    'video/x-matroska': ['#a18cd1', '#fbc2eb'],
  }
  const g = gradients[mimeType] || ['#667eea', '#764ba2']
  return g[index]
}

export default function FileGrid({ files, groupId, onPreview }: FileGridProps) {
  const mediaFiles = files.filter(f => isMedia(f.mimeType))
  const [thumbPaths, setThumbPaths] = useState<Record<number, string>>({})
  const loadingRef = useRef<Set<number>>(new Set())
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = Number((entry.target as HTMLElement).dataset.fileId)
        if (entry.isIntersecting && id && !loadingRef.current.has(id) && !thumbPaths[id]) {
          loadingRef.current.add(id)
          window.telegramAPI.downloadThumbnail(groupId, id).then(path => {
            setThumbPaths(prev => ({ ...prev, [id]: `file:///${path.replace(/\\/g, '/')}` }))
          }).catch(() => {
            loadingRef.current.delete(id)
          })
        }
      }
    }, { rootMargin: '100px' })

    return () => observerRef.current?.disconnect()
  }, [groupId])

  useEffect(() => {
    for (const [id, el] of cardRefs.current.entries()) {
      if (observerRef.current) {
        observerRef.current.unobserve(el)
        observerRef.current.observe(el)
      }
    }
  }, [mediaFiles.length])

  useEffect(() => {
    loadingRef.current.clear()
    setThumbPaths({})
  }, [groupId])

  if (mediaFiles.length === 0) {
    return <div className={styles.empty}>Sin archivos multimedia</div>
  }

  return (
    <div className={styles.grid}>
      {mediaFiles.map(f => {
        const thumbUrl = thumbPaths[f.id] || f.thumbnail || null

        return (
          <div
            key={f.id}
            ref={(el) => { if (el) cardRefs.current.set(f.id, el) }}
            data-file-id={f.id}
            onClick={() => onPreview(f)}
            className={styles.card}
            style={{
              background: thumbUrl
                ? '#0d0d1a'
                : `linear-gradient(135deg, ${getGradient(f.mimeType, 0)}, ${getGradient(f.mimeType, 1)})`
            }}
          >
            {thumbUrl ? (
              f.mimeType.startsWith('video/') ? (
                <img src={thumbUrl} alt="" className={styles.thumb} />
              ) : (
                <img src={thumbUrl} alt="" className={styles.thumb} />
              )
            ) : null}
            {f.mimeType.startsWith('video/') && (
              <div className={styles.videoBadge}>▶️</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
