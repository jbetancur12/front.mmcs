import { describe, expect, it } from 'vitest'
import { isHolidaySeason } from './holidaySeason'

describe('isHolidaySeason', () => {
  it('va del 15 de noviembre al 6 de enero', () => {
    expect(isHolidaySeason(new Date(2026, 10, 15))).toBe(true)
    expect(isHolidaySeason(new Date(2026, 11, 31))).toBe(true)
    expect(isHolidaySeason(new Date(2027, 0, 6))).toBe(true)
  })

  it('se apaga fuera de la temporada', () => {
    expect(isHolidaySeason(new Date(2026, 10, 14))).toBe(false)
    expect(isHolidaySeason(new Date(2027, 0, 7))).toBe(false)
    expect(isHolidaySeason(new Date(2026, 5, 1))).toBe(false)
  })
})
