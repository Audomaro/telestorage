import { useState, FormEvent } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StorageIcon from '@mui/icons-material/Storage'
import { COUNTRY_CODES, CountryCode } from '../data/countryCodes'

interface LoginFormProps {
  onSendCode: (phone: string) => void
  onVerifyCode: (phone: string, code: string) => void
  onCheck2FA: (password: string) => void
  onBack?: () => void
  codeHash?: string
  needs2FA?: boolean
  error?: string
  loading?: boolean
}

export default function LoginForm({ onSendCode, onVerifyCode, onCheck2FA, onBack, codeHash, needs2FA, error, loading }: LoginFormProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0])
  const [phoneError, setPhoneError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (needs2FA && codeHash) {
      onCheck2FA(password)
    } else if (codeHash) {
      onVerifyCode(phone, code)
    } else {
      const fullPhone = `${selectedCountry.phone}${phone}`
      onSendCode(fullPhone)
    }
  }

  const showBack = codeHash || needs2FA

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', px: 2 }}>
      {showBack && onBack && (
        <Box sx={{ alignSelf: 'flex-start', mb: 1 }}>
          <IconButton onClick={onBack} aria-label="Volver">
            <ArrowBackIcon />
          </IconButton>
        </Box>
      )}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <StorageIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        <Typography variant="h5">TeleStorage</Typography>
        {!codeHash && !needs2FA && (
          <Stack direction="row" gap={1} sx={{ width: '100%' }}>
            <Autocomplete
              size="small"
              options={COUNTRY_CODES}
              getOptionLabel={o => `${o.phone} ${o.label}`}
              value={selectedCountry}
              onChange={(_, v) => setSelectedCountry(v || COUNTRY_CODES[0])}
              sx={{ width: 180 }}
              renderInput={params => <TextField {...params} label="País" />}
              disabled={loading}
            />
            <TextField label="Número de teléfono" placeholder="555 123 4567" fullWidth
              slotProps={{ htmlInput: { 'data-testid': 'phone-input' } }}
              value={phone} onChange={e => {
                const v = e.target.value.replace(/[^0-9]/g, '')
                setPhone(v)
                setPhoneError(v.length > 0 && v.length < 7 ? 'Número muy corto' : '')
              }}
              error={!!phoneError}
              helperText={phoneError}
              disabled={loading} autoFocus />
          </Stack>
        )}
        {codeHash && !needs2FA && (
          <>
            <Typography variant="body2" color="text.secondary">
              Enviamos un código a {phone}
            </Typography>
            <TextField label="Código de verificación" placeholder="Código" fullWidth
              slotProps={{ htmlInput: { 'data-testid': 'code-input' } }}
              value={code} onChange={e => setCode(e.target.value)} disabled={loading} autoFocus />
          </>
        )}
        {needs2FA && (
          <>
            <Typography variant="body2" color="text.secondary">
              Tu cuenta tiene verificación en dos pasos
            </Typography>
            <TextField label="Contraseña 2FA" type="password" placeholder="Contraseña" fullWidth
              slotProps={{ htmlInput: { 'data-testid': 'password-input' } }}
              value={password} onChange={e => setPassword(e.target.value)} disabled={loading} autoFocus />
          </>
        )}
        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        <Button variant="contained" fullWidth type="submit" disabled={loading} sx={{ mt: 1 }} data-testid="submit-button">
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {loading ? 'Procesando...' : needs2FA ? 'Iniciar sesión' : codeHash ? 'Verificar código' : 'Enviar código'}
        </Button>
      </form>
    </Box>
  )
}
