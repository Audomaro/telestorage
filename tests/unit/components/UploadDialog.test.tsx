import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import UploadDialog from '../../../src/components/UploadDialog'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

beforeEach(() => {
  window.telegramAPI = {
    ...window.telegramAPI,
    pickFiles: vi.fn().mockResolvedValue([]),
  }
})

const defaultProps = { groupId: 1, onUploadComplete: vi.fn(), onClose: vi.fn() }

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
})
