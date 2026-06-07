import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadDialog from '../../../src/components/UploadDialog'

describe('UploadDialog', () => {
  it('should render with drag and drop area', () => {
    render(<UploadDialog onUpload={() => {}} onClose={() => {}} />)
    expect(screen.getByText(/arrastra un archivo/i)).toBeDefined()
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    render(<UploadDialog onUpload={() => {}} onClose={onClose} />)
    fireEvent.click(screen.getByText(/cancelar/i))
    expect(onClose).toHaveBeenCalled()
  })
})
