import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getTheme } from './theme'

interface ColorModeContextValue {
  mode: 'light' | 'dark'
  toggleColorMode: () => void
  setMode: (m: 'light' | 'dark') => void
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
  setMode: () => {},
})

export const useColorMode = () => useContext(ColorModeContext)

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      if (s.themeMode) setMode(s.themeMode)
    })
  }, [])

  const toggleColorMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      window.telegramAPI.setSettings({ themeMode: next } as any)
      return next
    })
  }

  const theme = getTheme(mode)

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
