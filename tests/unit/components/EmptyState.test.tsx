import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import EmptyState from '../../../src/components/EmptyState'
import FolderOffIcon from '@mui/icons-material/FolderOff'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState icon={<FolderOffIcon />} title="Sin grupos" />, { wrapper: Wrapper })
    expect(screen.getByText('Sin grupos')).toBeDefined()
  })

  it('should render subtitle when provided', () => {
    render(<EmptyState icon={<FolderOffIcon />} title="Sin grupos" subtitle="Crea un nuevo grupo" />, { wrapper: Wrapper })
    expect(screen.getByText('Crea un nuevo grupo')).toBeDefined()
  })

  it('should render action when provided', () => {
    render(<EmptyState icon={<FolderOffIcon />} title="Sin grupos" action={<button>Crear</button>} />, { wrapper: Wrapper })
    expect(screen.getByText('Crear')).toBeDefined()
  })
})
