import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import TransferItem from '../../../src/components/TransferItem'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('TransferItem (download)', () => {
  it('should render file name', () => {
    render(<TransferItem task={{ id: '1', fileName: 'photo.jpg', progress: 0.5, status: 'downloading' }} type="download" onRemove={() => {}} onOpenFolder={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('photo.jpg')).toBeDefined()
  })
})
