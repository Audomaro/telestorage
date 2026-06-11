import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from '../../../src/components/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('should render title and message', () => {
    render(<ConfirmDialog title="Confirmar" message="¿Estás seguro?" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Confirmar')).toBeDefined()
    expect(screen.getByText('¿Estás seguro?')).toBeDefined()
  })

  it('should call onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog title="Confirmar" message="¿Estás seguro?" onConfirm={onConfirm} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog title="Confirmar" message="¿Estás seguro?" onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('should show custom confirm label', () => {
    render(<ConfirmDialog title="Confirmar" message="¿Seguro?" confirmLabel="Borrar" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Borrar')).toBeDefined()
  })

  it('should disable buttons when loading', () => {
    render(<ConfirmDialog title="Confirmar" message="¿Seguro?" loading onConfirm={vi.fn()} onCancel={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => expect(btn).toBeDisabled())
  })
})
