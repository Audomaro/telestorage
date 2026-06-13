import { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1 }}>
      <Box sx={{ color: '#0088cc', '& .MuiSvgIcon-root': { fontSize: 72 } }}>
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#222222' }}>{title}</Typography>
      {subtitle && <Typography variant="body2" sx={{ color: 'rgba(19,78,74,0.6)' }}>{subtitle}</Typography>}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  )
}
