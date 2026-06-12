import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import FileListItem from '../../../src/components/FileListItem'
import { TelegramFile } from '../../../src/types'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

const mockFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date() as any, groupId: 123,
}

describe('FileListItem', () => {
  it('should render file name', () => {
    render(<FileListItem file={mockFile} isReadOnly={false} onDownload={() => {}} onDelete={() => {}} selectMode={false} selected={false} onToggleSelect={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('foto.jpg')).toBeDefined()
  })

  it('should call onDownload when download button clicked', () => {
    const onDownload = vi.fn()
    render(<FileListItem file={mockFile} isReadOnly={false} onDownload={onDownload} onDelete={() => {}} selectMode={false} selected={false} onToggleSelect={() => {}} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Descargar' }))
    expect(onDownload).toHaveBeenCalledWith(mockFile)
  })

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<FileListItem file={mockFile} isReadOnly={false} onDownload={() => {}} onDelete={onDelete} selectMode={false} selected={false} onToggleSelect={() => {}} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(onDelete).toHaveBeenCalledWith(mockFile)
  })

  it('should hide delete button when isReadOnly', () => {
    render(<FileListItem file={mockFile} isReadOnly={true} onDownload={() => {}} onDelete={() => {}} selectMode={false} selected={false} onToggleSelect={() => {}} />, { wrapper: Wrapper })
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  })

  it('should show file size', () => {
    render(<FileListItem file={mockFile} isReadOnly={false} onDownload={() => {}} onDelete={() => {}} selectMode={false} selected={false} onToggleSelect={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText(/2.0 KB/)).toBeDefined()
  })
})
