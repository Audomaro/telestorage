import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PreviewModal from '../../../src/components/PreviewModal'
import { TelegramFile } from '../../../src/types'

const mockFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date() as any, groupId: 123
}

describe('PreviewModal', () => {
  it('should render file name', () => {
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
  })

  it('should show video icon for video files', () => {
    const videoFile = { ...mockFile, mimeType: 'video/mp4', name: 'video.mp4' }
    render(<PreviewModal file={videoFile} onClose={() => {}} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('🎬')).toBeDefined()
  })

  it('should call onClose when clicking close button', () => {
    const onClose = vi.fn()
    render(<PreviewModal file={mockFile} onClose={onClose} onDownload={() => {}} onDelete={() => {}} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onDownload when clicking download', () => {
    const onDownload = vi.fn()
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={onDownload} onDelete={() => {}} />)
    fireEvent.click(screen.getByTitle('Descargar'))
    expect(onDownload).toHaveBeenCalledWith(mockFile)
  })

  it('should call onDelete when clicking delete', () => {
    const onDelete = vi.fn()
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={() => {}} onDelete={onDelete} />)
    fireEvent.click(screen.getByTitle('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith(mockFile)
  })

  it('should hide delete button when readonly', () => {
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={() => {}} onDelete={() => {}} readonly={true} />)
    expect(screen.queryByTitle('Eliminar')).toBeNull()
  })

  it('should show forward button', () => {
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={() => {}} onDelete={() => {}} onForward={() => {}} />)
    expect(screen.getByTitle('Reenviar')).toBeDefined()
  })
})
