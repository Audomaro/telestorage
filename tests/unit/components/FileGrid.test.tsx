import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileGrid from '../../../src/components/FileGrid'
import { TelegramFile } from '../../../src/types'

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date() as any, groupId: 123 },
  { id: 2, messageId: 2, name: 'video.mp4', size: 1048576, mimeType: 'video/mp4', date: new Date() as any, groupId: 123 },
  { id: 3, messageId: 3, name: 'foto2.png', size: 4096, mimeType: 'image/png', date: new Date() as any, groupId: 123 },
  { id: 4, messageId: 4, name: 'doc.pdf', size: 204800, mimeType: 'application/pdf', date: new Date() as any, groupId: 123 },
]

describe('FileGrid', () => {
  it('should render media files in grid', () => {
    render(<FileGrid files={mockFiles} onPreview={() => {}} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
    expect(screen.getByText('video.mp4')).toBeDefined()
    expect(screen.getByText('foto2.png')).toBeDefined()
  })

  it('should show video badge for video files', () => {
    render(<FileGrid files={mockFiles} onPreview={() => {}} />)
    expect(screen.getByText('▶️')).toBeDefined()
  })

  it('should not show non-media files', () => {
    render(<FileGrid files={mockFiles} onPreview={() => {}} />)
    expect(screen.queryByText('doc.pdf')).toBeNull()
  })

  it('should call onPreview when clicking an item', () => {
    const onPreview = vi.fn()
    render(<FileGrid files={mockFiles} onPreview={onPreview} />)
    fireEvent.click(screen.getByText('foto.jpg'))
    expect(onPreview).toHaveBeenCalledWith(mockFiles[0])
  })

  it('should show empty state', () => {
    render(<FileGrid files={[]} onPreview={() => {}} />)
    expect(screen.getByText(/sin archivos multimedia/i)).toBeDefined()
  })
})
