import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import DownloadItem from '../../../src/components/DownloadItem'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('DownloadItem', () => {
  it('should render file name', () => {
    render(<DownloadItem task={{ id: '1', fileName: 'photo.jpg', progress: 0.5, status: 'downloading' }} onRemove={() => {}} onOpenFolder={() => {}} onRetry={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('photo.jpg')).toBeDefined()
  })
})
