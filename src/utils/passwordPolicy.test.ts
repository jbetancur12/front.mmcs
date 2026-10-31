import { describe, expect, it } from 'vitest'
import { PASSWORD_MIN_LENGTH } from 'src/constants/passwordPolicy'
import {
  generateStrongPassword,
  getPasswordRules,
  isCommonPassword,
  isPasswordValid
} from './passwordPolicy'

const rule = (password: string, id: string) =>
  getPasswordRules(password).find((r) => r.id === id)?.met

describe('getPasswordRules', () => {
  it('una contraseña vacía no cumple ninguna regla', () => {
    expect(getPasswordRules('').every((r) => !r.met)).toBe(true)
  })

  it('exige el largo mínimo', () => {
    expect(rule('Xk9mPq2zL', 'length')).toBe(false)
    expect(rule('Xk9mPq2zLw', 'length')).toBe(true)
    expect(PASSWORD_MIN_LENGTH).toBe(10)
  })

  it('exige minúscula, mayúscula y número', () => {
    expect(rule('XK9MPQ2ZLW', 'lower')).toBe(false)
    expect(rule('xk9mpq2zlw', 'upper')).toBe(false)
    expect(rule('XkmPqzLwBn', 'digit')).toBe(false)
  })
})

describe('isCommonPassword', () => {
  it('detecta contraseñas comunes sin importar mayúsculas', () => {
    expect(isCommonPassword('password')).toBe(true)
    expect(isCommonPassword('PASSWORD')).toBe(true)
    expect(isCommonPassword('Qwerty')).toBe(true)
  })

  it('detecta una común con números o símbolos al final', () => {
    expect(isCommonPassword('Password123')).toBe(true)
    expect(isCommonPassword('admin2026!')).toBe(true)
  })

  it('no marca una contraseña al azar', () => {
    expect(isCommonPassword('Xk9mPq2zLw')).toBe(false)
  })
})

describe('isPasswordValid', () => {
  it('acepta una contraseña que cumple todo', () => {
    expect(isPasswordValid('Xk9mPq2zLw')).toBe(true)
  })

  it('rechaza si falla cualquier regla', () => {
    expect(isPasswordValid('')).toBe(false)
    expect(isPasswordValid('Xk9mPq2zL')).toBe(false) // corta
    expect(isPasswordValid('xk9mpq2zlw')).toBe(false) // sin mayúscula
    expect(isPasswordValid('XkmPqzLwBn')).toBe(false) // sin número
    expect(isPasswordValid('Password123')).toBe(false) // común
  })
})

describe('generateStrongPassword', () => {
  it('siempre genera una contraseña válida', () => {
    for (let i = 0; i < 50; i++) {
      expect(isPasswordValid(generateStrongPassword())).toBe(true)
    }
  })

  it('respeta el largo pedido y nunca baja del mínimo', () => {
    expect(generateStrongPassword(20)).toHaveLength(20)
    expect(generateStrongPassword(3).length).toBeGreaterThanOrEqual(
      PASSWORD_MIN_LENGTH
    )
  })

  it('no repite la misma contraseña', () => {
    expect(generateStrongPassword()).not.toBe(generateStrongPassword())
  })
})
