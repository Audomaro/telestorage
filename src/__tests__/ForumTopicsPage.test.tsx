import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import ForumTopicsPage from '../pages/ForumTopicsPage'
import { TelegramGroup, ForumTopic } from '../types'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

const mockGroup: TelegramGroup = {
  id: 123,
  title: 'Test Forum',
  isArchived: false,
  isOwner: true,
  isForum: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  window.telegramAPI = {
    ...window.telegramAPI,
    getForumTopics: vi.fn().mockResolvedValue([]),
  } as any
})

describe('ForumTopicsPage', () => {
  it('should show loading state (skeletons) initially', () => {
    const { container } = render(
      <ForumTopicsPage group={mockGroup} onSelectTopic={() => {}} onBack={() => {}} />,
      { wrapper: Wrapper }
    )
    expect(container.querySelectorAll('[data-testid="skeleton-loader"]').length).toBeGreaterThan(0)
  })

  it('should show empty state when no topics are returned', async () => {
    render(
      <ForumTopicsPage group={mockGroup} onSelectTopic={() => {}} onBack={() => {}} />,
      { wrapper: Wrapper }
    )
    await waitFor(() => {
      expect(screen.getByText('No hay temas en este foro')).toBeDefined()
    })
  })
})
