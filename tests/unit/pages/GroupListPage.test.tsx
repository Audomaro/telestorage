import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import GroupListPage from '../../../src/pages/GroupListPage'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  window.telegramAPI = {
    ...window.telegramAPI,
    getGroups: vi.fn().mockResolvedValue([]),
    getArchivedGroups: vi.fn().mockResolvedValue([]),
    createGroup: vi.fn().mockResolvedValue({}),
    deleteGroup: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue({ defaultTab: 'created' }),
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
      getSettings: vi.fn().mockResolvedValue({ defaultTab: 'created' }),
    } as any
  })

  it('should show only app-created groups by default', async () => {
    render(<GroupListPage />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
      expect(screen.getByText('Another App')).toBeDefined()
    })
    expect(screen.queryByText('Other Group')).toBeNull()
  })

  it('should show all groups when tab is changed to Activos', async () => {
    render(<GroupListPage />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Activos'))
    await waitFor(() => {
      expect(screen.getByText('App Group')).toBeDefined()
      expect(screen.getByText('Other Group')).toBeDefined()
    })
  })

  it('should show empty message when no app-created groups exist', async () => {
    window.telegramAPI.getGroups = vi.fn().mockResolvedValue([
      { id: 2, title: 'Other Group', isArchived: false, isOwner: false, isAppCreated: false },
    ])
    render(<GroupListPage />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(screen.getByText(/No tienes grupos de TeleStorage/i)).toBeDefined()
    })
  })
})

describe('GroupListPage', () => {
  it('should show loading state initially', () => {
    const { container } = render(<GroupListPage />, { wrapper: Wrapper })
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0)
  })

  it('should not load archived groups on initial load', async () => {
    render(<GroupListPage />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(window.telegramAPI.getGroups).toHaveBeenCalled()
      expect(window.telegramAPI.getArchivedGroups).not.toHaveBeenCalled()
    })
  })

  it('should load archived groups when tab is clicked', async () => {
    render(<GroupListPage />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(window.telegramAPI.getGroups).toHaveBeenCalled()
    })
    fireEvent.click(screen.getByText('Archivados'))
    expect(window.telegramAPI.getArchivedGroups).toHaveBeenCalled()
  })
})
