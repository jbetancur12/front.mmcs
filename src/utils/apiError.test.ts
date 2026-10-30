import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorReason,
  parseApiError
} from './apiError'

const fail = (status: number, data: unknown) => ({ response: { status, data } })

describe('parseApiError', () => {
  it('entiende el formato estándar del errorHandler', () => {
    const error = fail(409, {
      success: false,
      error: { code: 'CONFLICT', message: 'El registro ya existe' }
    })
    expect(parseApiError(error)).toEqual({
      status: 409,
      code: 'CONFLICT',
      message: 'El registro ya existe',
      details: []
    })
  })

  it('entiende { error: "texto" }', () => {
    expect(getApiErrorReason(fail(400, { error: 'Falta el nombre' }))).toBe(
      'Falta el nombre'
    )
  })

  it('entiende { message: "texto" }', () => {
    expect(getApiErrorReason(fail(404, { message: 'No existe' }))).toBe(
      'No existe'
    )
  })

  it('prefiere el detalle por campo en validación', () => {
    const error = fail(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
        details: [
          { field: 'contraseña', message: 'Es muy común' },
          { field: 'email', message: 'Correo inválido' }
        ]
      }
    })
    expect(getApiErrorReason(error)).toBe('Es muy común. Correo inválido')
    expect(parseApiError(error).details).toHaveLength(2)
  })

  it('acepta details como texto', () => {
    expect(getApiErrorReason(fail(400, { details: 'Sin cupo' }))).toBe(
      'Sin cupo'
    )
  })

  it('no devuelve [object Object] con errores raros', () => {
    expect(getApiErrorReason(fail(400, { error: {} }))).toBeNull()
    expect(getApiErrorReason(fail(400, { error: { message: 5 } }))).toBeNull()
  })

  it('sin respuesta (red o timeout) devuelve estado 0 y sin motivo', () => {
    expect(parseApiError(new Error('Network Error'))).toEqual({
      status: 0,
      code: null,
      message: null,
      details: []
    })
    expect(getApiErrorReason(undefined)).toBeNull()
  })
})

describe('getApiErrorMessage', () => {
  it('agrega el motivo en 4xx y no lo expone en 5xx', () => {
    expect(
      getApiErrorMessage(fail(400, { error: { message: 'Dato malo' } }), 'No se pudo.')
    ).toBe('No se pudo. Dato malo')
    expect(
      getApiErrorMessage(fail(500, { error: { message: 'Interno' } }), 'No se pudo.')
    ).toBe('No se pudo.')
  })
})

describe('getApiErrorCode', () => {
  it('devuelve el código estructurado', () => {
    expect(getApiErrorCode(fail(403, { error: { code: 'FORBIDDEN' } }))).toBe(
      'FORBIDDEN'
    )
    expect(getApiErrorCode(fail(403, { error: 'texto' }))).toBeNull()
  })
})
