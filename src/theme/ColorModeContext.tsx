import { createContext, useContext, useState, ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getTheme } from './theme'

interface ColorModeContextValue {
  mode: 'light' | 'dark'
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
})

export const useColorMode = () => useContext(ColorModeContext)

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const toggleColorMode = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'))
  const theme = getTheme(mode)

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
