import { createTheme } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: '#4CAF50', light: '#81C784', dark: '#388E3C', contrastText: '#ffffff' },
    secondary: { main: '#66BB6A' },
    ...(mode === 'dark' ? {
      background: { default: '#121212', paper: '#1e1e1e' },
      text: { primary: '#e0e0e0', secondary: '#9e9e9e' },
      divider: '#333333',
    } : {
      background: { default: '#fafafa', paper: '#ffffff' },
      text: { primary: '#212121', secondary: '#616161' },
      divider: '#e0e0e0',
    }),
    error: { main: mode === 'dark' ? '#ef5350' : '#e53935' },
    warning: { main: mode === 'dark' ? '#FFA726' : '#FF9800' },
    success: { main: mode === 'dark' ? '#66BB6A' : '#4CAF50' },
    info: { main: mode === 'dark' ? '#42A5F5' : '#2196F3' },
  },
  shape: { borderRadius: 8 },
  typography: { fontSize: 14 },
})
