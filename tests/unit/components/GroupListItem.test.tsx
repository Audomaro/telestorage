import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import GroupListItem from '../../../src/components/GroupListItem'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

const mockGroup = {
  id: 123,
  title: 'MiDrive-Fotos',
  isArchived: false,
  isOwner: true,
  isAppCreated: true,
  totalSize: 1048576,
}

describe('GroupListItem', () => {
  it('should render group title', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('MiDrive-Fotos')).toBeDefined()
  })

  it('should show "Propio" badge when isOwner is true', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('Propio')).toBeDefined()
  })

  it('should show "Tercero" badge when isOwner is false', () => {
    const thirdParty = { ...mockGroup, isOwner: false }
    render(<GroupListItem group={thirdParty} onClick={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('Tercero')).toBeDefined()
  })

  it('should call onClick with group when clicked', () => {
    const onClick = vi.fn()
    render(<GroupListItem group={mockGroup} onClick={onClick} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('MiDrive-Fotos'))
    expect(onClick).toHaveBeenCalledWith(mockGroup)
  })

  it('should show "Archivado" when isArchived is true', () => {
    const archived = { ...mockGroup, isArchived: true }
    render(<GroupListItem group={archived} onClick={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText((content) => content.includes('Archivado'))).toBeDefined()
  })
})
