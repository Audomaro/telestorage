import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import TransferPanel from '../../../src/components/TransferPanel'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('TransferPanel', () => {
  it('should exist', () => {
    render(<TransferPanel />, { wrapper: Wrapper })
    expect(document.body).toBeDefined()
  })
})
