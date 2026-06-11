import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadDialog from '../../../src/components/UploadDialog'

const defaultProps = { groupId: 1, onUpload: vi.fn(), onClose: vi.fn() }

describe('UploadDialog', () => {
  it('should render with drag and drop area', () => {
    render(<UploadDialog {...defaultProps} />)
    expect(screen.getByText(/arrastra archivos/i)).toBeDefined()
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    render(<UploadDialog {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText(/cancelar/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('should show upload button disabled when no files selected', () => {
    render(<UploadDialog {...defaultProps} />)
    const btn = screen.getByRole('button', { name: /subir/i })
    expect(btn).toBeDisabled()
  })
})
