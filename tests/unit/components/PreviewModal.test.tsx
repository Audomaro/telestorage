import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PreviewModal from '../../../src/components/PreviewModal'
import { TelegramFile } from '../../../src/types'

const imageFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date() as any, groupId: 123
}

const pdfFile: TelegramFile = {
  id: 2, messageId: 2, name: 'doc.pdf', size: 4096,
  mimeType: 'application/pdf', date: new Date() as any, groupId: 123
}

const defaultMocks = () => ({
  onClose: vi.fn(),
  onDownload: vi.fn(),
  onDelete: vi.fn(),
})

describe('PreviewModal', () => {
  it('should render file info in fallback for non-media files', async () => {
    const mocks = defaultMocks()
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/doc.pdf')
    render(<PreviewModal file={pdfFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('doc.pdf')).toBeDefined()
    })
  })

  it('should render image when onLoadOriginal resolves', async () => {
    const mocks = defaultMocks()
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    const { container } = render(
      <PreviewModal file={imageFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onLoadOriginal={onLoadOriginal} />
    )
    await waitFor(() => {
      const img = container.querySelector('img')
      expect(img).toBeDefined()
      expect(img?.getAttribute('src')).toBe('/tmp/foto.jpg')
    })
  })

  it('should show loading state initially then emoji fallback for non-media', async () => {
    const mocks = defaultMocks()
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/doc.pdf')
    render(<PreviewModal file={pdfFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('🖼️')).toBeDefined()
    })
  })

  it('should call onClose when close button clicked', async () => {
    const mocks = defaultMocks()
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    render(<PreviewModal file={imageFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('✕')).toBeDefined()
    })
    fireEvent.click(screen.getByText('✕'))
    expect(mocks.onClose).toHaveBeenCalled()
  })

  it('should show error when onLoadOriginal rejects', async () => {
    const mocks = defaultMocks()
    const onLoadOriginal = vi.fn().mockRejectedValue(new Error('Falló la carga'))
    render(<PreviewModal file={imageFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('Falló la carga')).toBeDefined()
    })
  })

  it('should call onSaveToDisk when download button clicked with onSaveToDisk', async () => {
    const mocks = defaultMocks()
    const onSaveToDisk = vi.fn().mockResolvedValue(undefined)
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    render(<PreviewModal file={imageFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onSaveToDisk={onSaveToDisk} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('⬇️')).toBeDefined()
    })
    fireEvent.click(screen.getByText('⬇️'))
    await waitFor(() => {
      expect(onSaveToDisk).toHaveBeenCalledWith(imageFile, expect.any(Function))
    })
  })

  it('should fallback to onDownload when onSaveToDisk is not provided', async () => {
    const mocks = defaultMocks()
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    render(<PreviewModal file={imageFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('⬇️')).toBeDefined()
    })
    fireEvent.click(screen.getByText('⬇️'))
    expect(mocks.onDownload).toHaveBeenCalledWith(imageFile)
  })

  it('should call onDelete when delete button clicked', async () => {
    const mocks = defaultMocks()
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    render(<PreviewModal file={imageFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('🗑️')).toBeDefined()
    })
    fireEvent.click(screen.getByText('🗑️'))
    expect(mocks.onDelete).toHaveBeenCalledWith(imageFile)
  })

  it('should show saving progress indicator during save', async () => {
    const mocks = defaultMocks()
    const onSaveToDisk = vi.fn(() => new Promise<void>(() => {}))
    const onLoadOriginal = vi.fn().mockResolvedValue('/tmp/foto.jpg')
    render(<PreviewModal file={imageFile} groupId={123} onClose={mocks.onClose} onDownload={mocks.onDownload} onDelete={mocks.onDelete} onSaveToDisk={onSaveToDisk} onLoadOriginal={onLoadOriginal} />)
    await waitFor(() => {
      expect(screen.getByText('⬇️')).toBeDefined()
    })
    fireEvent.click(screen.getByText('⬇️'))
    await waitFor(() => {
      expect(screen.getByText(/guardando/i)).toBeDefined()
    })
  })
})
