import { describe, expect, it } from 'vitest'
import { formatDateOnly } from './dateOnly'

describe('formatDateOnly', () => {
  it('devuelve null si el valor falta o no es una fecha', () => {
    expect(formatDateOnly(undefined)).toBeNull()
    expect(formatDateOnly(null)).toBeNull()
    expect(formatDateOnly('')).toBeNull()
    expect(formatDateOnly('no es una fecha')).toBeNull()
  })

  it('una fecha sin hora se muestra tal cual', () => {
    expect(formatDateOnly('2026-10-31')).toBe('31/10/2026')
    expect(formatDateOnly('2026-01-01')).toBe('01/01/2026')
  })

  it('medianoche UTC no retrocede un día por la zona horaria', () => {
    expect(formatDateOnly('2026-10-31T00:00:00.000Z')).toBe('31/10/2026')
    expect(formatDateOnly('2026-10-31T00:00:00Z')).toBe('31/10/2026')
    expect(formatDateOnly('2026-03-01T00:00:00.000Z')).toBe('01/03/2026')
  })

  it('una fecha con hora se pasa a hora local y mantiene el formato dd/MM/yyyy', () => {
    expect(formatDateOnly('2026-10-31T15:30:00Z')).toMatch(
      /^\d{2}\/\d{2}\/\d{4}$/
    )
  })
})
