import { useState, FormEvent } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import StorageIcon from '@mui/icons-material/Storage'

interface LoginFormProps {
  onSendCode: (phone: string) => void
  onVerifyCode: (phone: string, code: string) => void
  onCheck2FA: (password: string) => void
  codeHash?: string
  needs2FA?: boolean
  error?: string
  loading?: boolean
}

export default function LoginForm({ onSendCode, onVerifyCode, onCheck2FA, codeHash, needs2FA, error, loading }: LoginFormProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (needs2FA && codeHash) {
      onCheck2FA(password)
    } else if (codeHash) {
      onVerifyCode(phone, code)
    } else {
      onSendCode(phone)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', px: 2 }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <StorageIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        <Typography variant="h5">TeleStorage</Typography>
        {!codeHash && !needs2FA && (
          <TextField label="Número de teléfono" placeholder="+52 555 123 4567" fullWidth
            value={phone} onChange={e => setPhone(e.target.value)}
            disabled={loading} autoFocus />
        )}
        {codeHash && !needs2FA && (
          <>
            <Typography variant="body2" color="text.secondary">
              Enviamos un código a {phone}
            </Typography>
            <TextField label="Código de verificación" placeholder="Código" fullWidth
              value={code} onChange={e => setCode(e.target.value)} disabled={loading} autoFocus />
          </>
        )}
        {needs2FA && (
          <>
            <Typography variant="body2" color="text.secondary">
              Tu cuenta tiene verificación en dos pasos
            </Typography>
            <TextField label="Contraseña 2FA" type="password" placeholder="Contraseña" fullWidth
              value={password} onChange={e => setPassword(e.target.value)} disabled={loading} autoFocus />
          </>
        )}
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        <Button variant="contained" fullWidth type="submit" disabled={loading} sx={{ mt: 1 }}>
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {loading ? 'Procesando...' : needs2FA ? 'Iniciar sesión' : codeHash ? 'Verificar código' : 'Enviar código'}
        </Button>
      </form>
    </Box>
  )
}
