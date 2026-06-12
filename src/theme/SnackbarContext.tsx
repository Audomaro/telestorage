import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { AlertColor } from '@mui/material/Alert'

interface SnackbarState {
  open: boolean
  message: string
  severity: AlertColor
}

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: AlertColor) => void
}

const SnackbarContext = createContext<SnackbarContextValue>({
  showSnackbar: () => {},
})

export const useSnackbar = () => useContext(SnackbarContext)

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false, message: '', severity: 'info',
  })

  const showSnackbar = useCallback((message: string, severity: AlertColor = 'info') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
