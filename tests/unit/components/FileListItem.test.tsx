import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileListItem from '../../../src/components/FileListItem'
import { TelegramFile } from '../../../src/types'

const mockFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date() as any, groupId: 123
}

describe('FileListItem', () => {
  it('should render file name', () => {
    render(<FileListItem file={mockFile} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
  })

  it('should show file type icon', () => {
    render(<FileListItem file={mockFile} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('🖼️')).toBeDefined()
  })

  it('should call onDownload when download button clicked', () => {
    const onDownload = vi.fn()
    render(<FileListItem file={mockFile} onDownload={onDownload} onDelete={() => {}} />)
    fireEvent.click(screen.getByTitle('Descargar'))
    expect(onDownload).toHaveBeenCalledWith(mockFile)
  })

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<FileListItem file={mockFile} onDownload={() => {}} onDelete={onDelete} />)
    fireEvent.click(screen.getByTitle('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith(mockFile)
  })

  it('should hide delete button when readonly', () => {
    render(<FileListItem file={mockFile} onDownload={() => {}} onDelete={() => {}} readonly={true} />)
    expect(screen.queryByTitle('Eliminar')).toBeNull()
  })

  it('should show file size', () => {
    render(<FileListItem file={mockFile} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText(/2.0 KB/)).toBeDefined()
  })
})
