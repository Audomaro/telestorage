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
      <Box sx={{ color: 'action.disabled', '& .MuiSvgIcon-root': { fontSize: 64 } }}>
        {icon}
      </Box>
      <Typography variant="h6" color="text.secondary">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.disabled">{subtitle}</Typography>}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  )
}
