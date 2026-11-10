import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@utils/use-axios-private', () => ({
  default: () => ({ put: vi.fn() })
}))

// El selector real arma el valor tecleando por secciones; aquí basta ver lo que el modal recibe en onChange.
vi.mock('@mui/x-date-pickers', () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  DatePicker: ({
    label,
    value,
    onChange
  }: {
    label: string
    value: Date | null
    onChange: (date: Date | null) => void
  }) => (
    <input
      aria-label={label}
      data-value={value ? value.toISOString() : ''}
      onChange={(event) =>
        onChange(event.target.value ? new Date(event.target.value) : null)
      }
    />
  )
}))
vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({ AdapterDateFns: {} }))

import UpdateCertificateModal from './UpdateCertificateModal'

describe('UpdateCertificateModal: fechas', () => {
  const errors: string[] = []
  const onError = (event: ErrorEvent) => {
    event.preventDefault()
    errors.push(event.message)
  }

  beforeEach(() => {
    errors.length = 0
    window.addEventListener('error', onError)
  })

  afterEach(() => {
    window.removeEventListener('error', onError)
  })

  const renderModal = () =>
    render(
      <UpdateCertificateModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        id='1'
      />
    )

  it('una fecha de calibración a medias (inválida) no lanza "Invalid time value"', () => {
    renderModal()

    fireEvent.change(screen.getByLabelText('Fecha de calibración'), {
      target: { value: 'no-es-fecha' }
    })

    expect(
      errors.filter((message) => message.includes('Invalid time value'))
    ).toEqual([])
    expect(
      screen.getByLabelText('Fecha de calibración').getAttribute('data-value')
    ).toBe('')
  })

  it('una próxima calibración a medias (inválida) tampoco lanza el error', () => {
    renderModal()

    fireEvent.change(screen.getByLabelText('Próxima calibración'), {
      target: { value: 'no-es-fecha' }
    })

    expect(
      errors.filter((message) => message.includes('Invalid time value'))
    ).toEqual([])
  })

  it('una fecha válida sigue calculando la próxima calibración un año después', () => {
    renderModal()

    fireEvent.change(screen.getByLabelText('Fecha de calibración'), {
      target: { value: '2024-05-10T12:00:00Z' }
    })

    expect(
      screen.getByLabelText('Próxima calibración').getAttribute('data-value')
    ).toBe('2025-05-10T12:00:00.000Z')
  })
})
