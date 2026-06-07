import { useState, FormEvent } from 'react'

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
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '100px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 24, textAlign: 'center', fontSize: 28, color: '#333' }}>TeleDrive</h1>
      
      {!codeHash && !needs2FA && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#555' }}>Número de teléfono</label>
          <input
            type="tel"
            placeholder="+52 555 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', outline: 'none' }}
            autoFocus
          />
        </div>
      )}

      {codeHash && !needs2FA && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#555' }}>Código de verificación</label>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Enviamos un código a {phone}</p>
          <input
            type="text"
            placeholder="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', outline: 'none' }}
            autoFocus
          />
        </div>
      )}

      {needs2FA && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#555' }}>Contraseña 2FA</label>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Tu cuenta tiene verificación en dos pasos</p>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', outline: 'none' }}
            autoFocus
          />
        </div>
      )}

      {error && (
        <div style={{ color: '#d32f2f', marginBottom: 16, fontSize: 14, background: '#FFEBEE', padding: '8px 12px', borderRadius: 6 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: 12, fontSize: 16, borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? '#A5D6A7' : '#4CAF50', color: 'white', border: 'none', fontWeight: 600
        }}
      >
        {loading ? 'Procesando...' : needs2FA ? 'Iniciar sesión' : codeHash ? 'Verificar código' : 'Enviar código'}
      </button>
    </form>
  )
}
