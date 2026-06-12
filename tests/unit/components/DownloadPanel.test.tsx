import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import DownloadPanel from '../../../src/components/DownloadPanel'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('DownloadPanel', () => {
  it('should exist', () => {
    render(<DownloadPanel />, { wrapper: Wrapper })
    expect(document.body).toBeDefined()
  })
})
