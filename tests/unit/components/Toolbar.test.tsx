import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Toolbar from '../../../src/components/Toolbar'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('Toolbar', () => {
  it('should show filter buttons', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('Todos')).toBeDefined()
    expect(screen.getByText('Multimedia')).toBeDefined()
    expect(screen.getByText('Documentos')).toBeDefined()
  })

  it('should call onFilterChange when clicking filter', () => {
    const onFilter = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={onFilter} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Multimedia'))
    expect(onFilter).toHaveBeenCalledWith('media')
  })

  it('should call onUpload when upload button clicked', () => {
    const onUpload = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={onUpload} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Subir'))
    expect(onUpload).toHaveBeenCalled()
  })

  it('should hide upload button when showUpload is false', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={false} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} />, { wrapper: Wrapper })
    expect(screen.queryByText('+ Subir')).toBeNull()
  })

  it('should render search field when viewMode is list', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} searchQuery="" onSearchChange={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByPlaceholderText('Buscar archivos...')).toBeDefined()
  })

  it('should render search field when viewMode is gallery', () => {
    render(<Toolbar viewMode="gallery" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} searchQuery="" onSearchChange={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByPlaceholderText('Buscar archivos...')).toBeDefined()
  })

  it('should call onSearchChange when typing in search field', () => {
    const onSearchChange = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} showUpload={true} selectMode={false} selectedCount={0} onToggleSelectMode={() => {}} onBatchDelete={() => {}} searchQuery="" onSearchChange={onSearchChange} />, { wrapper: Wrapper })
    fireEvent.change(screen.getByPlaceholderText('Buscar archivos...'), { target: { value: 'test' } })
    expect(onSearchChange).toHaveBeenCalledWith('test')
  })
})
