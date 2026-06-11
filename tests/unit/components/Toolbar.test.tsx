import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../../../src/components/Toolbar'

describe('Toolbar', () => {
  it('should show view mode buttons', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    expect(screen.getByText(/Lista/)).toBeDefined()
    expect(screen.getByText(/Galería/)).toBeDefined()
  })

  it('should highlight active list view', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    expect(screen.getByText(/Lista/)).toBeDefined()
  })

  it('should highlight active gallery view', () => {
    render(<Toolbar viewMode="gallery" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    expect(screen.getByText(/Galería/)).toBeDefined()
  })

  it('should call onViewModeChange when clicking view button', () => {
    const onChange = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={onChange} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    fireEvent.click(screen.getByText(/Galería/))
    expect(onChange).toHaveBeenCalledWith('gallery')
  })

  it('should show filter buttons', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    expect(screen.getByText('Todos')).toBeDefined()
    expect(screen.getByText('Multimedia')).toBeDefined()
    expect(screen.getByText('Documentos')).toBeDefined()
  })

  it('should call onFilterChange when clicking filter', () => {
    const onFilter = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={onFilter} onUpload={() => {}} />)
    fireEvent.click(screen.getByText('Multimedia'))
    expect(onFilter).toHaveBeenCalledWith('media')
  })

  it('should call onUpload when upload button clicked', () => {
    const onUpload = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={onUpload} />)
    fireEvent.click(screen.getByText('+ Subir'))
    expect(onUpload).toHaveBeenCalled()
  })

  it('should hide upload button when readonly', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} readonly={true} />)
    expect(screen.queryByText('+ Subir')).toBeNull()
  })
})
