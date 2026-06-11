import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileGrid from '../../../src/components/FileGrid'
import { TelegramFile } from '../../../src/types'

beforeEach(() => {
  window.alert = vi.fn()
  window.telegramAPI = {
    downloadThumbnail: vi.fn().mockRejectedValue(new Error('noop')),
  } as any

  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(window as any).IntersectionObserver = MockIntersectionObserver
})

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date() as any, groupId: 123, thumbnail: null },
  { id: 2, messageId: 2, name: 'video.mp4', size: 1048576, mimeType: 'video/mp4', date: new Date() as any, groupId: 123, thumbnail: null },
  { id: 3, messageId: 3, name: 'foto2.png', size: 4096, mimeType: 'image/png', date: new Date() as any, groupId: 123, thumbnail: null },
  { id: 4, messageId: 4, name: 'doc.pdf', size: 51200, mimeType: 'application/pdf', date: new Date() as any, groupId: 123, thumbnail: null },
]

describe('FileGrid', () => {
  it('should render 3 media items', () => {
    const { container } = render(<FileGrid files={mockFiles} groupId={123} onPreview={vi.fn()} />)
    const cards = container.querySelectorAll('[class*="card"]')
    expect(cards.length).toBe(3)
  })

  it('should show video badge for video files', () => {
    render(<FileGrid files={[mockFiles[1]]} groupId={123} onPreview={vi.fn()} />)
    expect(screen.getByText('▶️')).toBeDefined()
  })

  it('should call onPreview when clicking a card', () => {
    const onPreview = vi.fn()
    const { container } = render(<FileGrid files={[mockFiles[0]]} groupId={123} onPreview={onPreview} />)
    const card = container.querySelector('[class*="card"]')!
    fireEvent.click(card)
    expect(onPreview).toHaveBeenCalledWith(mockFiles[0])
  })

  it('should not show non-media files', () => {
    const { container } = render(<FileGrid files={mockFiles} groupId={123} onPreview={vi.fn()} />)
    const cards = container.querySelectorAll('[class*="card"]')
    expect(cards.length).toBe(3)
  })

  it('should show empty state when no media files', () => {
    render(<FileGrid files={[mockFiles[3]]} groupId={123} onPreview={vi.fn()} />)
    expect(screen.getByText(/sin archivos multimedia/i)).toBeDefined()
  })
})
