import { toNumber, withNumericFields } from './editPayload'

describe('toNumber', () => {
  it('convierte texto en entero y trata el vacío como 0', () => {
    expect(toNumber('12')).toBe(12)
    expect(toNumber('')).toBe(0)
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber('12.9')).toBe(12)
    expect(toNumber('abc')).toBe(0)
    expect(toNumber(7)).toBe(7)
  })
})

describe('withNumericFields', () => {
  it('manda los ciclos como número y deja el resto igual', () => {
    const result = withNumericFields({
      equipmentName: 'Termómetro',
      maintenanceCycle: '12',
      calibrationCycle: '6',
      insuredValue: 1000
    })
    expect(result).toEqual({
      equipmentName: 'Termómetro',
      maintenanceCycle: 12,
      calibrationCycle: 6,
      insuredValue: 1000
    })
  })

  it('un ciclo vacío se envía como 0, no como texto vacío', () => {
    expect(withNumericFields({ maintenanceCycle: '' }).maintenanceCycle).toBe(0)
  })

  it('no inventa campos que no están y no modifica el original', () => {
    const original = { maintenanceCycle: '12' }
    const result = withNumericFields(original)
    expect('calibrationCycle' in result).toBe(false)
    expect(original.maintenanceCycle).toBe('12')
  })
})
