import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'error'

export interface DownloadTask {
  id: string
  fileName: string
  progress: number
  status: DownloadStatus
  error?: string
  destPath?: string
  completedAt?: number
}

export interface DownloadContextValue {
  downloads: DownloadTask[]
  addDownload: (id: string, fileName: string) => void
  updateProgress: (id: string, progress: number) => void
  completeDownload: (id: string, destPath: string) => void
  failDownload: (id: string, error: string) => void
  removeDownload: (id: string) => void
  retryDownload: (id: string) => void
}

const DownloadContext = createContext<DownloadContextValue>({
  downloads: [],
  addDownload: () => {},
  updateProgress: () => {},
  completeDownload: () => {},
  failDownload: () => {},
  removeDownload: () => {},
  retryDownload: () => {},
})

export const useDownload = () => useContext(DownloadContext)

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadTask[]>([])

  const addDownload = useCallback((id: string, fileName: string) => {
    setDownloads(prev => [...prev, { id, fileName, progress: 0, status: 'downloading' }])
  }, [])

  const updateProgress = useCallback((id: string, progress: number) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, progress } : d))
  }, [])

  const completeDownload = useCallback((id: string, destPath: string) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'completed', progress: 1, destPath, completedAt: Date.now() } : d))
  }, [])

  const failDownload = useCallback((id: string, error: string) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'error', error } : d))
  }, [])

  const removeDownload = useCallback((id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id))
  }, [])

  const retryDownload = useCallback((id: string) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'downloading', error: undefined, progress: 0 } : d))
  }, [])

  return (
    <DownloadContext.Provider value={{ downloads, addDownload, updateProgress, completeDownload, failDownload, removeDownload, retryDownload }}>
      {children}
    </DownloadContext.Provider>
  )
}
