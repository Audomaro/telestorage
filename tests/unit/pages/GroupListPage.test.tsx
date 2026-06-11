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
    deleteGroup: vi.fn().mockResolvedValue(undefined)
  }
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
