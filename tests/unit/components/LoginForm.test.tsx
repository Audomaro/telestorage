import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import LoginForm from '../../../src/components/LoginForm'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
}

describe('LoginForm', () => {
  it('should show phone input initially', () => {
    render(<LoginForm onSendCode={() => {}} onVerifyCode={() => {}} onCheck2FA={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByPlaceholderText('+52 555 123 4567')).toBeDefined()
  })

  it('should call onSendCode when submitting phone', () => {
    const onSendCode = vi.fn()
    render(<LoginForm onSendCode={onSendCode} onVerifyCode={() => {}} onCheck2FA={() => {}} />, { wrapper: Wrapper })
    fireEvent.change(screen.getByPlaceholderText('+52 555 123 4567'), { target: { value: '+525551234567' } })
    fireEvent.click(screen.getByText(/enviar código/i))
    expect(onSendCode).toHaveBeenCalledWith('+525551234567')
  })

  it('should show code input after phone is submitted', () => {
    render(<LoginForm onSendCode={() => {}} onVerifyCode={() => {}} onCheck2FA={() => {}} codeHash="abc123" />, { wrapper: Wrapper })
    expect(screen.getByPlaceholderText(/código/i)).toBeDefined()
  })

  it('should show 2FA input when needs2FA is true', () => {
    render(<LoginForm onSendCode={() => {}} onVerifyCode={() => {}} onCheck2FA={() => {}} codeHash="abc123" needs2FA={true} />, { wrapper: Wrapper })
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeDefined()
  })

  it('should show error message', () => {
    render(<LoginForm onSendCode={() => {}} onVerifyCode={() => {}} onCheck2FA={() => {}} error="Código incorrecto" />, { wrapper: Wrapper })
    expect(screen.getByText('Código incorrecto')).toBeDefined()
  })

  it('should show loading state', () => {
    render(<LoginForm onSendCode={() => {}} onVerifyCode={() => {}} onCheck2FA={() => {}} loading={true} />, { wrapper: Wrapper })
    expect(screen.getByText('Procesando...')).toBeDefined()
  })

  it('should call onCheck2FA when submitting with needs2FA', () => {
    const onCheck2FA = vi.fn()
    render(<LoginForm onSendCode={() => {}} onVerifyCode={() => {}} onCheck2FA={onCheck2FA} codeHash="abc123" needs2FA={true} />, { wrapper: Wrapper })
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), { target: { value: 'mypassword' } })
    fireEvent.click(screen.getByText(/iniciar sesión/i))
    expect(onCheck2FA).toHaveBeenCalledWith('mypassword')
  })
})
