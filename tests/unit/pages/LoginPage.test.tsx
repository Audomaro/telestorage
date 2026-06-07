import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../../../src/pages/LoginPage'

// Mock window.telegramAPI
vi.mock('../../src/types', () => ({}))

describe('LoginPage', () => {
  it('should render LoginForm component', () => {
    render(<LoginPage onLogin={() => {}} />)
    expect(screen.getByText('TeleDrive')).toBeDefined()
  })
})
