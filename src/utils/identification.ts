/**
 * Identificación de clientes (NIT o cédula) con el dígito de verificación de
 * la DIAN. El NIT de una persona natural es su cédula, así que el mismo
 * algoritmo de módulo 11 sirve para los dos: se multiplican los dígitos de
 * derecha a izquierda por 3, 7, 13, 17... y se resta el residuo de 11.
 */

/** Pesos del dígito de verificación, de derecha a izquierda. */
const CHECK_DIGIT_WEIGHTS = [
  3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71
]

/** La DIAN admite documentos de hasta 15 dígitos. */
export const MAX_IDENTIFICATION_DIGITS = 15

/** Deja solo los dígitos: el campo no acepta puntos, espacios ni guiones. */
export const identificationDigits = (
  value: string | number | null | undefined
): string =>
  String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, MAX_IDENTIFICATION_DIGITS)

/**
 * Dígito de verificación del documento (módulo 11). Devuelve `null` cuando no
 * hay dígitos. Aplica igual a NIT de empresa y a cédula de persona natural.
 */
export const calculateCheckDigit = (
  value: string | number | null | undefined
): number | null => {
  const digits = identificationDigits(value)
  if (!digits) return null

  let sum = 0
  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits[digits.length - 1 - index])
    sum += digit * CHECK_DIGIT_WEIGHTS[index]
  }

  const remainder = sum % 11
  return remainder > 1 ? 11 - remainder : remainder
}

export interface ParsedIdentification {
  /** Número sin dígito de verificación, puntos ni espacios. */
  base: string
  /** Dígito de verificación calculado para la base. */
  checkDigit: number | null
}

/**
 * Separa la base del dígito de verificación. El guion marca el DV
 * ("900.123.456-7" → 900123456). Un valor sin guion se toma completo como
 * base ("75034538"), para no recortar cédulas que nunca se guardaron con DV.
 */
export const parseIdentification = (
  value: string | number | null | undefined
): ParsedIdentification => {
  const digits = identificationDigits(value)
  if (!digits) return { base: '', checkDigit: null }

  if (String(value).includes('-') && digits.length > 1) {
    const base = digits.slice(0, -1)
    const lastDigit = Number(digits.slice(-1))
    if (calculateCheckDigit(base) === lastDigit) {
      return { base, checkDigit: lastDigit }
    }
  }

  return { base: digits, checkDigit: calculateCheckDigit(digits) }
}

/**
 * Valor que se guarda en la base: "900123456-7". Vacío si no hay dígitos.
 * Así una cédula también queda con su DV, igual que en el RUT.
 */
export const normalizeIdentification = (
  value: string | number | null | undefined
): string => {
  const { base, checkDigit } = parseIdentification(value)
  return base && checkDigit !== null ? `${base}-${checkDigit}` : ''
}

/** Formato legible con separador de miles: "900.123.456-7". */
export const formatIdentification = (
  value: string | number | null | undefined
): string => {
  const { base, checkDigit } = parseIdentification(value)
  if (!base) return ''

  const grouped = base.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return checkDigit === null ? grouped : `${grouped}-${checkDigit}`
}
