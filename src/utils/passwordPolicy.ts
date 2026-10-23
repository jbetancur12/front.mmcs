import {
  COMMON_PASSWORDS,
  PASSWORD_MIN_LENGTH
} from 'src/constants/passwordPolicy'

/**
 * Reglas de contraseña para el checklist en vivo. Espejo de
 * api.mmcs/services/passwordPolicy.js (las constantes se generan de allí);
 * el servidor es quien decide, y también revisa que no contenga el correo o
 * el nombre, que aquí no se conocen.
 */

export interface PasswordRule {
  id: string
  label: string
  met: boolean
}

const COMMON = new Set(COMMON_PASSWORDS)

const stripAccents = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '')

export const isCommonPassword = (password: string): boolean => {
  const lower = stripAccents(password.toLowerCase())
  return COMMON.has(lower) || COMMON.has(lower.replace(/[^a-z]+$/, ''))
}

export const getPasswordRules = (password: string): PasswordRule[] => [
  {
    id: 'length',
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    met: password.length >= PASSWORD_MIN_LENGTH
  },
  { id: 'lower', label: 'Una letra minúscula', met: /[a-z]/.test(password) },
  { id: 'upper', label: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
  { id: 'digit', label: 'Un número', met: /\d/.test(password) },
  {
    id: 'common',
    label: 'Que no sea una contraseña común',
    met: password.length > 0 && !isCommonPassword(password)
  }
]

export const isPasswordValid = (password: string): boolean =>
  getPasswordRules(password).every((rule) => rule.met)

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'

/** Contraseña al azar (generador seguro del navegador) que cumple la política. */
export const generateStrongPassword = (length = 14): string => {
  for (;;) {
    const values = new Uint32Array(Math.max(length, PASSWORD_MIN_LENGTH))
    crypto.getRandomValues(values)
    const candidate = Array.from(values, (v) => CHARS[v % CHARS.length]).join(
      ''
    )
    if (isPasswordValid(candidate)) return candidate
  }
}
