import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PreviewModal from '../../../src/components/PreviewModal'
import { TelegramFile } from '../../../src/types'

const imageFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date() as any, groupId: 123
}

describe('PreviewModal', () => {
  it('should render file info', () => {
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
  })

  it('should render image when localPath is provided', () => {
    const { container } = render(
      <PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} localPath="/tmp/foto.jpg" />
    )
    const img = container.querySelector('img')
    expect(img).toBeDefined()
    expect(img?.getAttribute('src')).toBe('/tmp/foto.jpg')
  })

  it('should render emoji fallback when no localPath', () => {
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('🖼️')).toBeDefined()
  })

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<PreviewModal file={imageFile} onClose={onClose} onDownload={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onSaveToDisk when download button clicked with onSaveToDisk', async () => {
    const onSaveToDisk = vi.fn().mockResolvedValue(undefined)
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} onSaveToDisk={onSaveToDisk} />)
    fireEvent.click(screen.getByText('⬇️'))
    await waitFor(() => {
      expect(onSaveToDisk).toHaveBeenCalledWith(imageFile, expect.any(Function))
    })
  })

  it('should fallback to onDownload when onSaveToDisk is not provided', () => {
    const onDownload = vi.fn()
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={onDownload} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByText('⬇️'))
    expect(onDownload).toHaveBeenCalledWith(imageFile)
  })

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('🗑️'))
    expect(onDelete).toHaveBeenCalledWith(imageFile)
  })

  it('should show saving progress indicator during save', async () => {
    const onSaveToDisk = vi.fn(() => new Promise<void>(() => {}))
    render(<PreviewModal file={imageFile} onClose={vi.fn()} onDownload={vi.fn()} onDelete={vi.fn()} onSaveToDisk={onSaveToDisk} />)
    fireEvent.click(screen.getByText('⬇️'))
    await waitFor(() => {
      expect(screen.getByText(/guardando/i)).toBeDefined()
    })
  })
})
