import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import GroupListPage from '../../../src/pages/GroupListPage'

beforeEach(() => {
  vi.clearAllMocks()
  window.telegramAPI = {
    ...window.telegramAPI,
    getGroups: vi.fn().mockResolvedValue([]),
    getArchivedGroups: vi.fn().mockResolvedValue([]),
    createGroup: vi.fn().mockResolvedValue({}),
    deleteGroup: vi.fn().mockResolvedValue(undefined),
  }
})

describe('GroupListPage app filter', () => {
  const mockGroups = [
    { id: 1, title: 'App Group', isArchived: false, isOwner: true, isAppCreated: true },
    { id: 2, title: 'Other Group', isArchived: false, isOwner: false, isAppCreated: false },
    { id: 3, title: 'Another App', isArchived: false, isOwner: true, isAppCreated: true },
  ]

  beforeEach(() => {
    window.telegramAPI = {
      getGroups: vi.fn().mockResolvedValue(mockGroups),
      getArchivedGroups: vi.fn().mockResolvedValue([]),
      createGroup: vi.fn(),
      deleteGroup: vi.fn(),
    } as any
  })

  it('should show only app-created groups by default', async () => {
    render(<GroupListPage />)
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
      expect(screen.getByText('Another App')).toBeDefined()
    })
    expect(screen.queryByText('Other Group')).toBeNull()
  })

  it('should show all groups when filter is toggled to Todos', async () => {
    render(<GroupListPage />)
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Todos'))
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
      expect(screen.getByText('Other Group')).toBeDefined()
    })
  })

  it('should show empty message when no app-created groups exist', async () => {
    window.telegramAPI.getGroups = vi.fn().mockResolvedValue([
      { id: 2, title: 'Other Group', isArchived: false, isOwner: false, isAppCreated: false },
    ])
    render(<GroupListPage />)
    await waitFor(() => {
      expect(screen.getByText(/No hay grupos creados/i)).toBeDefined()
    })
  })
})

describe('GroupListPage', () => {
  it('should show loading state initially', () => {
    render(<GroupListPage />)
    expect(screen.getByText('Cargando grupos...')).toBeDefined()
  })

  it('should not load archived groups on initial load', async () => {
    render(<GroupListPage />)
    await waitFor(() => {
      expect(window.telegramAPI.getGroups).toHaveBeenCalled()
      expect(window.telegramAPI.getArchivedGroups).not.toHaveBeenCalled()
    })
  })

  it('should load archived groups when tab is clicked', async () => {
    render(<GroupListPage />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando grupos...')).toBeNull()
    })
    fireEvent.click(screen.getByText('Archivados'))
    expect(window.telegramAPI.getArchivedGroups).toHaveBeenCalled()
  })
})
