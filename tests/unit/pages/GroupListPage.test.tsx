import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GroupListPage from '../../../src/pages/GroupListPage'

beforeEach(() => {
  vi.clearAllMocks()
  window.telegramAPI = {
    ...window.telegramAPI,
    getGroups: vi.fn().mockResolvedValue([]),
    getArchivedGroups: vi.fn().mockResolvedValue([]),
    createGroup: vi.fn().mockResolvedValue({})
  }
})

describe('GroupListPage', () => {
  it('should show loading state initially', () => {
    render(<GroupListPage />)
    expect(screen.getByText('Cargando grupos...')).toBeDefined()
  })
})
