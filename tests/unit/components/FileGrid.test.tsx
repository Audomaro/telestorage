import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FileGrid from '../../../src/components/FileGrid'
import { TelegramFile } from '../../../src/types'

beforeEach(() => {
  window.alert = vi.fn()
})

function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date() as any, groupId: 123, thumbnail: 'data:image/jpeg;base64,/9j/4AAQ==' },
  { id: 2, messageId: 2, name: 'video.mp4', size: 1048576, mimeType: 'video/mp4', date: new Date() as any, groupId: 123, thumbnail: 'data:image/jpeg;base64,/9j/4AAQ==' },
  { id: 3, messageId: 3, name: 'foto2.png', size: 4096, mimeType: 'image/png', date: new Date() as any, groupId: 123 },
  { id: 4, messageId: 4, name: 'doc.pdf', size: 204800, mimeType: 'application/pdf', date: new Date() as any, groupId: 123 },
]

describe('FileGrid', () => {
  it('should render 3 media items', () => {
    const { container } = render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    const cards = container.querySelectorAll('[class*="card"]')
    expect(cards.length).toBe(3)
  })

  it('should show img tag when file has thumbnail', () => {
    const { container } = render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBe(2)
  })

  it('should show gradient fallback when no thumbnail', () => {
    const { container } = render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    const items = container.querySelectorAll('[style*="linear-gradient"]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('should call onDownload when clicking an item', async () => {
    const onDownload = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    const { container } = render(<FileGrid files={[mockFiles[0]]} onDownload={onDownload} />)
    const card = container.querySelector('[class*="card"]')!
    fireEvent.click(card)
    await waitFor(() => {
      expect(onDownload).toHaveBeenCalledWith(mockFiles[0], expect.any(Function))
    })
  })

  it('should show video badge for video files', () => {
    render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    expect(screen.getByText('▶️')).toBeDefined()
  })

  it('should show progress overlay during download', async () => {
    const onDownload = vi.fn(() => new Promise<string>(() => {}))
    render(<FileGrid files={[mockFiles[0]]} onDownload={onDownload} />)
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeDefined()
    })
  })

  it('should not show non-media files', () => {
    const { container } = render(<FileGrid files={mockFiles} onDownload={vi.fn()} />)
    const cards = container.querySelectorAll('[class*="card"]')
    expect(cards.length).toBe(3)
  })

  it('should show empty state', () => {
    render(<FileGrid files={[]} onDownload={vi.fn()} />)
    expect(screen.getByText(/sin archivos multimedia/i)).toBeDefined()
  })

  it('should call alert when click download fails', async () => {
    const onDownload = vi.fn().mockRejectedValue(new Error('fail'))
    const { container } = render(<FileGrid files={[mockFiles[0]]} onDownload={onDownload} />)
    await flushMicrotasks()
    const card = container.querySelector('[class*="card"]')!
    fireEvent.click(card)
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error al descargar previsualización: fail')
    })
  })
})
