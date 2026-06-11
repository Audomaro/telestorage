import { useState, FormEvent } from 'react'
import styles from './LoginForm.module.css'

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
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>TeleDrive</h1>
      
      {!codeHash && !needs2FA && (
        <div className={styles.field}>
          <label className={styles.label}>Número de teléfono</label>
          <input
            type="tel"
            placeholder="+52 555 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className={styles.input}
            autoFocus
          />
        </div>
      )}

      {codeHash && !needs2FA && (
        <div className={styles.field}>
          <label className={styles.label}>Código de verificación</label>
          <p className={styles.hint}>Enviamos un código a {phone}</p>
          <input
            type="text"
            placeholder="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            className={styles.input}
            autoFocus
          />
        </div>
      )}

      {needs2FA && (
        <div className={styles.field}>
          <label className={styles.label}>Contraseña 2FA</label>
          <p className={styles.hint}>Tu cuenta tiene verificación en dos pasos</p>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className={styles.input}
            autoFocus
          />
        </div>
      )}

      {error && (
        <div className={styles.errorBox}>{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={styles.submitBtn}
        style={{ background: loading ? '#A5D6A7' : '#4CAF50' }}
      >
        {loading ? 'Procesando...' : needs2FA ? 'Iniciar sesión' : codeHash ? 'Verificar código' : 'Enviar código'}
      </button>
    </form>
  )
}
