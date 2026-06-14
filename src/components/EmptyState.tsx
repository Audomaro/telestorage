import { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const theme = useTheme()
  return (
    <Fade in timeout={400}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1.5 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 96, height: 96, borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
          '& .MuiSvgIcon-root': { fontSize: 44 },
          mb: 0.5,
        }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.3px' }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 300 }}>{subtitle}</Typography>}
        {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
      </Box>
    </Fade>
  )
}
