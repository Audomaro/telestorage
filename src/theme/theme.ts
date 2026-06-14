import { createTheme, alpha } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: '#0088cc', light: '#33A0D6', dark: '#0077b3', contrastText: '#ffffff' },
    secondary: { main: '#2AABEE' },
    error: { main: mode === 'dark' ? '#EF5350' : '#E53935' },
    warning: { main: '#F97316', dark: '#EA580C', contrastText: '#ffffff' },
    success: { main: mode === 'dark' ? '#66BB6A' : '#43A047' },
    info: { main: mode === 'dark' ? '#42A5F5' : '#2196F3' },
    ...(mode === 'dark'
      ? {
          background: { default: '#0F172A', paper: '#1E293B' },
          text: { primary: '#F1F5F9', secondary: '#94A3B8' },
          divider: alpha('#FFFFFF', 0.08),
        }
      : {
          background: { default: '#F0F6FA', paper: '#FFFFFF' },
          text: { primary: '#1A1A2E', secondary: '#4A5568' },
          divider: alpha('#0088cc', 0.12),
        }),
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 700, fontSize: '0.95rem' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.825rem' },
    caption: { fontSize: '0.75rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          transition: 'all 200ms',
        },
        containedPrimary: {
          '&:hover': { transform: 'translateY(-1px)' },
        },
        containedSecondary: {
          '&:hover': { transform: 'translateY(-1px)' },
        },
        outlined: {
          '&:hover': { transform: 'translateY(-1px)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: mode === 'dark'
            ? '0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#0088cc', 0.12),
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 200ms',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: mode === 'dark' ? '#334155 #0F172A' : '#99C2D9 #F0F6FA',
          '&::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: mode === 'dark' ? '#0F172A' : '#F0F6FA',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'dark' ? '#334155' : alpha('#0088cc', 0.5),
            borderRadius: 3,
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#475569' : alpha('#0088cc', 0.7),
            },
          },
        },
        '*': {
          '&::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'dark' ? '#334155' : alpha('#0088cc', 0.3),
            borderRadius: 3,
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#475569' : alpha('#0088cc', 0.5),
            },
          },
        },
      },
    },
  },
})
