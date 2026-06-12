import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import ForumTopicListItem from '../components/ForumTopicListItem'
import { ForumTopic } from '../types'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

const mockTopic: ForumTopic = {
  id: 1,
  groupId: 123,
  title: 'General',
  iconColor: 2,
  iconEmojiId: '1',
  totalSize: 1024,
}

describe('ForumTopicListItem', () => {
  it('should render the topic title', () => {
    render(<ForumTopicListItem topic={mockTopic} onClick={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('General')).toBeDefined()
  })

  it('should show the "Tema" badge', () => {
    render(<ForumTopicListItem topic={mockTopic} onClick={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('Tema')).toBeDefined()
  })

  it('should call onClick with the correct topic when clicked', () => {
    const onClick = vi.fn()
    render(<ForumTopicListItem topic={mockTopic} onClick={onClick} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('General'))
    expect(onClick).toHaveBeenCalledWith(mockTopic)
  })
})
