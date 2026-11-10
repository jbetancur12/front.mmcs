import { describe, expect, it } from 'vitest'
import { maskEmail, maskPhone } from './maskContact'

describe('maskContact', () => {
  it('enmascara el correo dejando la primera letra y el dominio', () => {
    expect(maskEmail('juan.perez@empresa.com')).toBe('j***@empresa.com')
  })

  it('no enmascara dos veces ni rompe con vacíos', () => {
    expect(maskEmail('j***@empresa.com')).toBe('j***@empresa.com')
    expect(maskEmail(null)).toBe('')
    expect(maskPhone(undefined)).toBe('')
  })

  it('enmascara el teléfono dejando los últimos 4 dígitos', () => {
    expect(maskPhone('+57 313 812 4282')).toBe('********4282')
    expect(maskPhone('******4282')).toBe('******4282')
    expect(maskPhone('123')).toBe('***')
  })
})
