import {
  calculateCheckDigit,
  formatIdentification,
  identificationDigits,
  normalizeIdentification,
  parseIdentification
} from './identification'

describe('identificación con dígito de verificación', () => {
  it('calcula el DV de un NIT de empresa', () => {
    // 860.031.606-6 es el NIT de Diana Corporación en la base actual.
    expect(calculateCheckDigit('860.031.606')).toBe(6)
    expect(calculateCheckDigit('890500060')).toBe(7)
    expect(calculateCheckDigit('900123456')).toBe(8)
  })

  it('calcula el DV de una cédula con el mismo algoritmo', () => {
    // Ejemplo del instructivo: 10.234.567-5.
    expect(calculateCheckDigit('10234567')).toBe(5)
    // La cédula 75.034.538 aparece en la base con DV 1.
    expect(calculateCheckDigit('75034538')).toBe(1)
  })

  it('deja solo dígitos y corta en 15', () => {
    expect(identificationDigits(' 900.123.456-7 ')).toBe('9001234567')
    expect(identificationDigits('12345678901234567890')).toBe('123456789012345')
    expect(identificationDigits(null)).toBe('')
  })

  it('separa la base del DV cuando viene con guion', () => {
    expect(parseIdentification('860.031.606-6')).toEqual({
      base: '860031606',
      checkDigit: 6
    })
    expect(parseIdentification('1.018.424.009-2')).toEqual({
      base: '1018424009',
      checkDigit: 2
    })
  })

  it('no recorta el último dígito de un valor sin guion', () => {
    expect(parseIdentification('75034538')).toEqual({
      base: '75034538',
      checkDigit: 1
    })
    expect(parseIdentification('1088242137')).toEqual({
      base: '1088242137',
      checkDigit: 1
    })
  })

  it('normaliza al formato base-DV que se guarda', () => {
    expect(normalizeIdentification('860.031.606-6')).toBe('860031606-6')
    expect(normalizeIdentification('860 031 606')).toBe('860031606-6')
    expect(normalizeIdentification('75034538')).toBe('75034538-1')
    expect(normalizeIdentification('')).toBe('')
  })

  it('formatea con puntos de miles para mostrar', () => {
    expect(formatIdentification('860031606')).toBe('860.031.606-6')
    expect(formatIdentification('10234567')).toBe('10.234.567-5')
    expect(formatIdentification('')).toBe('')
  })
})
