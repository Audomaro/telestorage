import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import SettingsPage from '../../../src/pages/SettingsPage'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

const mockSettings = {
  downloadPath: '/tmp',
  createdGroupIds: [],
  batchSize: 50,
  defaultTab: 'created' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  window.telegramAPI = {
    ...window.telegramAPI,
    getSettings: vi.fn().mockResolvedValue(mockSettings),
    setSettings: vi.fn().mockResolvedValue(mockSettings),
    selectFolder: vi.fn().mockResolvedValue('/tmp/new'),
  }
})

describe('SettingsPage batchSize', () => {
  it('should show default batch size of 50', async () => {
    render(<SettingsPage onBack={vi.fn()} />, { wrapper: Wrapper })
    await waitFor(() => {
      const input = screen.getByDisplayValue('50')
      expect(input).toBeDefined()
    })
  })

  it('should save updated batch size', async () => {
    render(<SettingsPage onBack={vi.fn()} />, { wrapper: Wrapper })
    await waitFor(() => {
      expect(screen.getByDisplayValue('50')).toBeDefined()
    })
    const input = screen.getByDisplayValue('50') as HTMLInputElement
    fireEvent.change(input, { target: { value: '25' } })
    fireEvent.click(screen.getByText('Guardar'))
    await waitFor(() => {
      expect(window.telegramAPI.setSettings).toHaveBeenCalledWith(
        expect.objectContaining({ batchSize: 25 })
      )
    })
  })
})
