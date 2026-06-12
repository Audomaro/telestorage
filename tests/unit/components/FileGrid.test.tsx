import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import FileGrid from '../../../src/components/FileGrid'
import { TelegramFile } from '../../../src/types'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

beforeEach(() => {
  window.telegramAPI = {
    downloadThumbnail: vi.fn().mockRejectedValue(new Error('noop')),
  } as any

  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(window as any).IntersectionObserver = MockIntersectionObserver
})

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date() as any, groupId: 123 },
  { id: 2, messageId: 2, name: 'video.mp4', size: 1048576, mimeType: 'video/mp4', date: new Date() as any, groupId: 123 },
  { id: 3, messageId: 3, name: 'foto2.png', size: 4096, mimeType: 'image/png', date: new Date() as any, groupId: 123 },
  { id: 4, messageId: 4, name: 'doc.pdf', size: 51200, mimeType: 'application/pdf', date: new Date() as any, groupId: 123 },
]

describe('FileGrid', () => {
  it('should render grid cards for each file', () => {
    const { container } = render(<FileGrid files={mockFiles} onPreview={vi.fn()} selectMode={false} selectedIds={new Set()} onToggleSelect={vi.fn()} />, { wrapper: Wrapper })
    const gridItems = container.querySelectorAll('[class*="MuiBox-root"]')
    expect(gridItems.length).toBeGreaterThan(0)
  })

  it('should show empty state when no files', () => {
    render(<FileGrid files={[]} onPreview={vi.fn()} selectMode={false} selectedIds={new Set()} onToggleSelect={vi.fn()} />, { wrapper: Wrapper })
    expect(screen.getByText(/sin archivos multimedia/i)).toBeDefined()
  })
})
