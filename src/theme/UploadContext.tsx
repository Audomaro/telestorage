import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type UploadStatus = 'uploading' | 'completed' | 'error'

export interface UploadTask {
  id: string
  fileName: string
  fileSize?: number
  progress: number
  status: UploadStatus
  error?: string
  completedAt?: number
}

export interface UploadContextValue {
  uploads: UploadTask[]
  addUpload: (id: string, fileName: string, fileSize?: number) => void
  updateProgress: (id: string, progress: number) => void
  completeUpload: (id: string) => void
  failUpload: (id: string, error: string) => void
  removeUpload: (id: string) => void
  retryUpload: (id: string) => void
}

const UploadContext = createContext<UploadContextValue>({
  uploads: [],
  addUpload: () => {},
  updateProgress: () => {},
  completeUpload: () => {},
  failUpload: () => {},
  removeUpload: () => {},
  retryUpload: () => {},
})

export const useUpload = () => useContext(UploadContext)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadTask[]>([])

  const addUpload = useCallback((id: string, fileName: string, fileSize?: number) => {
    setUploads(prev => [...prev, { id, fileName, fileSize, progress: 0, status: 'uploading' }])
  }, [])

  const updateProgress = useCallback((id: string, progress: number) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u))
  }, [])

  const completeUpload = useCallback((id: string) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'completed', progress: 1, completedAt: Date.now() } : u))
  }, [])

  const failUpload = useCallback((id: string, error: string) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error } : u))
  }, [])

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }, [])

  const retryUpload = useCallback((id: string) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'uploading', progress: 0, error: undefined } : u))
  }, [])

  return (
    <UploadContext.Provider value={{ uploads, addUpload, updateProgress, completeUpload, failUpload, removeUpload, retryUpload }}>
      {children}
    </UploadContext.Provider>
  )
}
