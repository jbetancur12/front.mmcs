import { describe, expect, it } from 'vitest'
import { canSeeNewLogo } from './newLogo'

describe('canSeeNewLogo', () => {
  it('lo ven admin y developer', () => {
    expect(canSeeNewLogo(['admin'])).toBe(true)
    expect(canSeeNewLogo(['developer'])).toBe(true)
    expect(canSeeNewLogo(['metrologist', 'developer'])).toBe(true)
  })

  it('no lo ven los demás roles ni quien no tiene sesión', () => {
    expect(canSeeNewLogo(['super_admin'])).toBe(false)
    expect(canSeeNewLogo(['comp_admin', 'user'])).toBe(false)
    expect(canSeeNewLogo([])).toBe(false)
    expect(canSeeNewLogo(undefined)).toBe(false)
  })
})
