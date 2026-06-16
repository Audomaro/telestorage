import { useState, FormEvent, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import Slide from '@mui/material/Slide'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StorageIcon from '@mui/icons-material/Storage'
import SendIcon from '@mui/icons-material/Send'
import LockIcon from '@mui/icons-material/Lock'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import PhoneIcon from '@mui/icons-material/Phone'
import PublicIcon from '@mui/icons-material/Public'
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
  const prevStep = useRef<'phone' | 'code' | '2fa'>('phone')
  const currentStep = needs2FA ? '2fa' : codeHash ? 'code' : 'phone'
  const direction = currentStep === prevStep.current ? 'left' : 'right'

  useEffect(() => {
    prevStep.current = currentStep
  }, [currentStep])

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

  const stepTitle = needs2FA ? 'Verificación en dos pasos' : codeHash ? 'Código de verificación' : 'Iniciar sesión'
  const stepDesc = needs2FA
    ? 'Tu cuenta tiene verificación en dos pasos activada'
    : codeHash
    ? `Enviamos un código a ${phone}`
    : 'Ingresa tu número de teléfono para comenzar'
  const submitLabel = needs2FA ? 'Iniciar sesión' : codeHash ? 'Verificar código' : 'Enviar código'
  const submitIcon = needs2FA ? <LockIcon /> : codeHash ? <VpnKeyIcon /> : <SendIcon />

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: { xs: 300, sm: 400 },
          height: { xs: 300, sm: 400 },
          borderRadius: '50%',
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'radial-gradient(circle, rgba(0,136,204,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0,136,204,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: { xs: 250, sm: 350 },
          height: { xs: 250, sm: 350 },
          borderRadius: '50%',
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          mx: 2,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          position: 'relative',
          bgcolor: (t) =>
            t.palette.mode === 'dark' ? alpha(t.palette.background.paper, 0.95) : 'background.paper',
          backdropFilter: { xs: 'none', sm: 'blur(12px)' },
        }}
      >
        {showBack && onBack && (
          <IconButton
            onClick={onBack}
            aria-label="Volver"
            size="small"
            sx={{ position: 'absolute', top: 12, left: 12, color: 'text.secondary' }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              mb: 1.5,
            }}
          >
            <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            TeleStorage
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Almacenamiento en la nube de Telegram
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
            {stepTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {stepDesc}
          </Typography>

          <Slide
            direction={direction}
            in={true}
            mountOnEnter
            unmountOnExit
            timeout={250}
            key={currentStep}
          >
            <Box>
              {currentStep === 'phone' && (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 2 }}>
                  <Autocomplete
                    size="small"
                    options={COUNTRY_CODES}
                    getOptionLabel={(o) => `${o.phone} ${o.label}`}
                    value={selectedCountry}
                    onChange={(_, v) => setSelectedCountry(v || COUNTRY_CODES[0])}
                    sx={{ minWidth: { xs: '100%', sm: 240 } }}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="País"
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps.input,
                            startAdornment: (
                              <>
                                <PublicIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} />
                                {params.slotProps.input.startAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  <TextField
                    size="small"
                    label="Número de teléfono"
                    placeholder="555 123 4567"
                    fullWidth
                    slotProps={{
                      htmlInput: { 'data-testid': 'phone-input' },
                      input: { startAdornment: <PhoneIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} /> },
                    }}
                    value={phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setPhone(v)
                      setPhoneError(v.length > 0 && v.length < 7 ? 'Ingresa al menos 7 dígitos' : '')
                    }}
                    error={!!phoneError}
                    helperText={phoneError}
                    disabled={loading}
                    autoFocus
                  />
                </Box>
              )}
              {currentStep === 'code' && (
                <TextField
                  label="Código de verificación"
                  placeholder="Código de 5 dígitos"
                  fullWidth
                  sx={{ mb: 2 }}
                  slotProps={{
                    htmlInput: { 'data-testid': 'code-input' },
                    input: { startAdornment: <VpnKeyIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} /> },
                  }}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              )}
              {currentStep === '2fa' && (
                <TextField
                  label="Contraseña 2FA"
                  type="password"
                  placeholder="Contraseña de verificación"
                  fullWidth
                  sx={{ mb: 2 }}
                  slotProps={{
                    htmlInput: { 'data-testid': 'password-input' },
                    input: { startAdornment: <LockIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} /> },
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              )}
            </Box>
          </Slide>

          <Fade in={!!error} timeout={200}>
            <Box>
              {error && (
                <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Fade>

          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading}
            data-testid="submit-button"
            sx={{
              py: 1.2,
              fontWeight: 700,
              fontSize: '0.9rem',
              gap: 1,
              '&:hover': { transform: 'translateY(-1px)' },
            }}
            endIcon={loading ? <CircularProgress size={18} color="inherit" /> : submitIcon}
          >
            {loading ? 'Procesando...' : submitLabel}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
