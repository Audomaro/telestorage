import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import UploadDialog from '../../../src/components/UploadDialog'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

const defaultProps = { groupId: 1, onUploadComplete: vi.fn(), onClose: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()
  window.telegramAPI = {
    ...window.telegramAPI,
    pickFiles: vi.fn().mockResolvedValue([]),
    uploadFile: vi.fn().mockResolvedValue({ messageId: 1 }),
    uploadTempFile: vi.fn().mockResolvedValue({ messageId: 1 }),
  }
})

describe('UploadDialog', () => {
  it('should render with drag and drop area', () => {
    render(<UploadDialog {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByText(/arrastra archivos/i)).toBeDefined()
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    render(<UploadDialog {...defaultProps} onClose={onClose} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText(/cancelar/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('should show upload button disabled when no files selected', () => {
    render(<UploadDialog {...defaultProps} />, { wrapper: Wrapper })
    const btn = screen.getByRole('button', { name: /subir/i })
    expect(btn).toBeDisabled()
  })

  it('should add files when pickFiles returns multiple paths', async () => {
    window.telegramAPI.pickFiles = vi.fn().mockResolvedValue([
      '/path/to/file1.pdf',
      '/path/to/file2.jpg',
      '/path/to/file3.png',
    ])
    render(<UploadDialog {...defaultProps} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText(/arrastra archivos/i))
    await vi.waitFor(() => {
      expect(screen.getByText('file1.pdf')).toBeDefined()
      expect(screen.getByText('file2.jpg')).toBeDefined()
      expect(screen.getByText('file3.png')).toBeDefined()
    })
  })

  it('should enable upload button after files are added', async () => {
    window.telegramAPI.pickFiles = vi.fn().mockResolvedValue(['/path/to/file.pdf'])
    render(<UploadDialog {...defaultProps} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText(/arrastra archivos/i))
    await vi.waitFor(() => {
      expect(screen.getByText('file.pdf')).toBeDefined()
    })
    const btn = screen.getByRole('button', { name: /subir/i })
    expect(btn).not.toBeDisabled()
  })

  it('should call uploadFile for each selected file', async () => {
    window.telegramAPI.pickFiles = vi.fn().mockResolvedValue(['/a/1.txt', '/a/2.txt'])
    window.telegramAPI.uploadFile = vi.fn().mockResolvedValue({ messageId: 1 })
    const onComplete = vi.fn()
    render(<UploadDialog {...defaultProps} onUploadComplete={onComplete} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText(/arrastra archivos/i))
    await vi.waitFor(() => expect(screen.getByText('1.txt')).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: /subir/i }))
    await vi.waitFor(() => {
      expect(window.telegramAPI.uploadFile).toHaveBeenCalledTimes(2)
      expect(window.telegramAPI.uploadFile).toHaveBeenCalledWith(1, '/a/1.txt', undefined)
      expect(window.telegramAPI.uploadFile).toHaveBeenCalledWith(1, '/a/2.txt', undefined)
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it('should allow removing individual files', async () => {
    window.telegramAPI.pickFiles = vi.fn().mockResolvedValue(['/a/file.pdf'])
    render(<UploadDialog {...defaultProps} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText(/arrastra archivos/i))
    await vi.waitFor(() => expect(screen.getByText('file.pdf')).toBeDefined())
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    fireEvent.click(screen.getAllByRole('button').filter(b => b.querySelector('svg'))[0])
    await vi.waitFor(() => {
      expect(screen.queryByText('file.pdf')).toBeNull()
    })
  })
})
