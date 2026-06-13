import { createTheme } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: '#0088cc', light: '#33A0D6', dark: '#0077b3', contrastText: '#ffffff' },
    secondary: { main: '#2AABEE' },
    ...(mode === 'dark' ? {
      background: { default: '#17212B', paper: '#242F3D' },
      text: { primary: '#FFFFFF', secondary: '#8E9296' },
      divider: '#313D4F',
    } : {
      background: { default: '#FFFFFF', paper: '#FFFFFF' },
      text: { primary: '#222222', secondary: '#707579' },
      divider: '#E7E8EA',
    }),
    error: { main: mode === 'dark' ? '#EF5350' : '#E53935' },
    warning: { main: mode === 'dark' ? '#FFA726' : '#FF9800' },
    success: { main: mode === 'dark' ? '#66BB6A' : '#4CAF50' },
    info: { main: mode === 'dark' ? '#42A5F5' : '#2196F3' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
  },
})
