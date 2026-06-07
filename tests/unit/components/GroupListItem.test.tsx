import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GroupListItem from '../../../src/components/GroupListItem'

const mockGroup = {
  id: 123,
  title: 'MiDrive-Fotos',
  isArchived: false,
  isOwner: true,
  fileCount: 245,
  totalSize: 1048576
}

describe('GroupListItem', () => {
  it('should render group title', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />)
    expect(screen.getByText('MiDrive-Fotos')).toBeDefined()
  })

  it('should show "Propio" badge when isOwner is true', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />)
    expect(screen.getByText('Propio')).toBeDefined()
  })

  it('should show "Tercero" badge when isOwner is false', () => {
    const thirdParty = { ...mockGroup, isOwner: false }
    render(<GroupListItem group={thirdParty} onClick={() => {}} />)
    expect(screen.getByText('Tercero')).toBeDefined()
  })

  it('should call onClick with group when clicked', () => {
    const onClick = vi.fn()
    render(<GroupListItem group={mockGroup} onClick={onClick} />)
    fireEvent.click(screen.getByText('MiDrive-Fotos'))
    expect(onClick).toHaveBeenCalledWith(mockGroup)
  })

  it('should show file count', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />)
    expect(screen.getByText(/245/)).toBeDefined()
  })

  it('should show "Archivado" when isArchived is true', () => {
    const archived = { ...mockGroup, isArchived: true }
    render(<GroupListItem group={archived} onClick={() => {}} />)
    expect(screen.getByText((content) => content.includes('Archivado'))).toBeDefined()
  })
})
