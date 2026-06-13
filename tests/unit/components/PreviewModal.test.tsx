import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import PreviewModal from '../../../src/components/PreviewModal'
import { TelegramFile } from '../../../src/types'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

const imageFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date() as any, groupId: 123,
}

const pdfFile: TelegramFile = {
  id: 2, messageId: 2, name: 'doc.pdf', size: 4096,
  mimeType: 'application/pdf', date: new Date() as any, groupId: 123,
}

describe('PreviewModal', () => {
  it('should render file name in toolbar', async () => {
    window.telegramAPI = { downloadPreview: vi.fn().mockResolvedValue('/tmp/doc.pdf') } as any
    render(<PreviewModal file={pdfFile} files={[pdfFile]} groupId={123} isReadOnly={false} onClose={vi.fn()} onDelete={vi.fn()} />, { wrapper: Wrapper })
    expect(screen.getByText('doc.pdf')).toBeDefined()
  })

  it('should render image when downloadPreview resolves', async () => {
    window.telegramAPI = { downloadPreview: vi.fn().mockResolvedValue('/tmp/foto.jpg') } as any
    render(
      <PreviewModal file={imageFile} files={[imageFile]} groupId={123} isReadOnly={false} onClose={vi.fn()} onDelete={vi.fn()} />, { wrapper: Wrapper }
    )
    await waitFor(() => {
      const img = screen.getByTestId('preview-image')
      expect(img).toBeDefined()
      expect(img?.getAttribute('src')).toBe('/tmp/foto.jpg')
    })
  })

  it('should call onClose when close button clicked', async () => {
    window.telegramAPI = { downloadPreview: vi.fn().mockResolvedValue('/tmp/foto.jpg') } as any
    const onClose = vi.fn()
    render(<PreviewModal file={imageFile} files={[imageFile]} groupId={123} isReadOnly={false} onClose={onClose} onDelete={vi.fn()} />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(screen.getByLabelText('Cerrar')).toBeDefined()
    })
    fireEvent.click(screen.getByLabelText('Cerrar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onDelete when delete button clicked', async () => {
    window.telegramAPI = { downloadPreview: vi.fn().mockResolvedValue('/tmp/foto.jpg') } as any
    const onDelete = vi.fn()
    render(<PreviewModal file={imageFile} files={[imageFile]} groupId={123} isReadOnly={false} onClose={vi.fn()} onDelete={onDelete} />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(screen.getByLabelText('Eliminar')).toBeDefined()
    })
    fireEvent.click(screen.getByLabelText('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith(imageFile)
  })

  it('should render embed for pdf files', async () => {
    window.telegramAPI = { downloadPreview: vi.fn().mockResolvedValue('C:\\tmp\\doc.pdf') } as any
    render(<PreviewModal file={pdfFile} files={[pdfFile]} groupId={123} isReadOnly={false} onClose={vi.fn()} onDelete={vi.fn()} />, { wrapper: Wrapper })
    await waitFor(() => {
      const embed = document.querySelector('embed')
      expect(embed).toBeDefined()
      expect(embed?.getAttribute('src')).toBe('file:///C:/tmp/doc.pdf')
    })
  })

  it('should return null when file is null', () => {
    window.telegramAPI = { downloadPreview: vi.fn() } as any
    const { container } = render(<PreviewModal file={null} files={[]} groupId={123} isReadOnly={false} onClose={vi.fn()} onDelete={vi.fn()} />, { wrapper: Wrapper })
    expect(container.innerHTML).toBe('')
  })
})
