import { describe, expect, it } from 'vitest'
import {
  dateInputToIso,
  formatDateOnly,
  isFutureDay,
  pickerDateToInput,
  pickerDateToIso,
  todayInputValue
} from './dateOnly'

describe('todayInputValue', () => {
  it('da el día local, no el UTC: de noche en Colombia no es "mañana"', () => {
    // 20 de noviembre, 23:30 hora local: en UTC-5 el día UTC ya sería el 21
    expect(todayInputValue(new Date(2026, 10, 20, 23, 30))).toBe('2026-11-20')
    expect(todayInputValue(new Date(2026, 10, 20, 0, 5))).toBe('2026-11-20')
  })
})

describe('dateInputToIso', () => {
  it('hoy va con la hora actual, no a mediodía: por la mañana el mediodía sería futuro y el API lo rechaza', () => {
    const morning = new Date(2026, 10, 20, 9, 15)
    expect(dateInputToIso('2026-11-20', morning)).toBe(morning.toISOString())
    expect(
      new Date(dateInputToIso('2026-11-20', morning)!).getTime()
    ).toBeLessThanOrEqual(morning.getTime())
  })

  it('otro día va a mediodía local', () => {
    const now = new Date(2026, 10, 20, 9, 15)
    expect(dateInputToIso('2026-11-19', now)).toBe(
      new Date(2026, 10, 19, 12, 0, 0).toISOString()
    )
  })

  it('vacía o inválida da undefined, sin lanzar', () => {
    expect(dateInputToIso('')).toBeUndefined()
    expect(dateInputToIso(null)).toBeUndefined()
    expect(dateInputToIso(undefined)).toBeUndefined()
    expect(() => dateInputToIso('no-es-fecha')).not.toThrow()
    expect(dateInputToIso('no-es-fecha')).toBeUndefined()
  })
})

describe('pickerDateToIso', () => {
  it('convierte una fecha completa a ISO', () => {
    const date = new Date(Date.UTC(2026, 10, 5, 12))
    expect(pickerDateToIso(date)).toBe('2026-11-05T12:00:00.000Z')
  })

  it('una fecha borrada da cadena vacía y una inválida da null, sin lanzar', () => {
    expect(pickerDateToIso(null)).toBe('')
    expect(() => pickerDateToIso(new Date(NaN))).not.toThrow()
    expect(pickerDateToIso(new Date(NaN))).toBeNull()
  })
})

describe('pickerDateToInput', () => {
  it('convierte una fecha completa a yyyy-MM-dd en hora local', () => {
    expect(pickerDateToInput(new Date(2026, 10, 5))).toBe('2026-11-05')
  })

  it('una fecha borrada da cadena vacía', () => {
    expect(pickerDateToInput(null)).toBe('')
  })

  it('una fecha tecleada a medias (inválida) da null en vez de lanzar "Invalid time value"', () => {
    expect(() => pickerDateToInput(new Date(NaN))).not.toThrow()
    expect(pickerDateToInput(new Date(NaN))).toBeNull()
  })
})

describe('isFutureDay', () => {
  const now = new Date(2026, 10, 4, 15, 30)

  it('detecta los días posteriores a hoy', () => {
    expect(isFutureDay(new Date(2026, 10, 5), now)).toBe(true)
    expect(isFutureDay(new Date(2026, 11, 1), now)).toBe(true)
  })

  it('hoy (a cualquier hora) y los días anteriores no son futuros', () => {
    expect(isFutureDay(new Date(2026, 10, 4, 23, 59), now)).toBe(false)
    expect(isFutureDay(new Date(2026, 10, 4, 0, 0), now)).toBe(false)
    expect(isFutureDay(new Date(2026, 10, 3), now)).toBe(false)
  })

  it('una fecha inválida no se considera futura', () => {
    expect(isFutureDay(new Date('no es una fecha'), now)).toBe(false)
  })
})

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
