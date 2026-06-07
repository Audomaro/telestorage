import { useState } from 'react'
import LoginForm from '../components/LoginForm'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [codeHash, setCodeHash] = useState<string | undefined>()
  const [needs2FA, setNeeds2FA] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (p: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await window.telegramAPI.sendCode(p)
      setCodeHash(result.codeHash)
      setPhone(p)
    } catch (err: any) {
      setError(err.message || 'Error al enviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (p: string, code: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await window.telegramAPI.verifyCode(p, code, codeHash!)
      if (result.needs2FA) {
        setNeeds2FA(true)
      } else {
        onLogin()
      }
    } catch (err: any) {
      setError(err.message || 'Código incorrecto')
    } finally {
      setLoading(false)
    }
  }

  const handleCheck2FA = async (password: string) => {
    setLoading(true)
    setError('')
    try {
      await window.telegramAPI.check2FA(password)
      onLogin()
    } catch (err: any) {
      setError(err.message || 'Contraseña incorrecta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginForm
      onSendCode={handleSendCode}
      onVerifyCode={handleVerifyCode}
      onCheck2FA={handleCheck2FA}
      codeHash={codeHash}
      needs2FA={needs2FA}
      error={error}
      loading={loading}
    />
  )
}
