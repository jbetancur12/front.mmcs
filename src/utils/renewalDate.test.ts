import { describe, expect, it } from 'vitest'
import { nextRenewalDate } from './renewalDate'

describe('nextRenewalDate', () => {
  it('suma un año a la fecha de vencimiento', () => {
    expect(nextRenewalDate('2026-11-05', '2026-11-05')).toBe('2027-11-05')
    expect(nextRenewalDate('2027-03-15', '2026-11-05')).toBe('2028-03-15')
  })

  it('si ya venció, parte de hoy', () => {
    expect(nextRenewalDate('2025-01-01', '2026-11-05')).toBe('2027-11-05')
  })

  it('ajusta el 29 de febrero al 28 del año siguiente', () => {
    expect(nextRenewalDate('2028-02-29', '2026-11-05')).toBe('2029-02-28')
  })
})
