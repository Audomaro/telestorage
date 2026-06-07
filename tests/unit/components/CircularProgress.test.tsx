import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CircularProgress from '../../../src/components/CircularProgress'

describe('CircularProgress', () => {
  it('should render SVG element', () => {
    const { container } = render(<CircularProgress size={60} progress={0.5} />)
    expect(container.querySelector('svg')).toBeDefined()
  })

  it('should display progress percentage', () => {
    render(<CircularProgress size={60} progress={0.5} />)
    expect(screen.getByText('50%')).toBeDefined()
  })

  it('should display 0% for zero progress', () => {
    render(<CircularProgress size={60} progress={0} />)
    expect(screen.getByText('0%')).toBeDefined()
  })

  it('should display 100% for complete progress', () => {
    render(<CircularProgress size={60} progress={1} />)
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('should have correct SVG viewBox', () => {
    const { container } = render(<CircularProgress size={60} progress={0.3} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 60 60')
  })

  it('should accept custom strokeWidth', () => {
    const { container } = render(<CircularProgress size={60} progress={0.5} strokeWidth={5} />)
    const circles = container.querySelectorAll('circle')
    circles.forEach(c => {
      expect(c.getAttribute('stroke-width')).toBe('5')
    })
  })
})
