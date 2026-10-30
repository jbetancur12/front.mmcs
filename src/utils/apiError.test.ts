import {
  getApiErrorPayload,
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

describe('getApiErrorPayload y código de la raíz', () => {
  it('lee los campos de la raíz (formato viejo)', () => {
    const error = fail(401, { message: 'Sesión cerrada', code: 'SESSION_REVOKED', reason: 'replaced' })
    expect(getApiErrorPayload(error)).toMatchObject({ code: 'SESSION_REVOKED', reason: 'replaced' })
    expect(getApiErrorCode(error)).toBe('SESSION_REVOKED')
  })

  it('lee los campos dentro de error (formato estándar)', () => {
    const error = fail(409, {
      success: false,
      error: { code: 'ACTIVE_SESSIONS', message: 'Ya tienes una sesión', limit: 3, sessions: [{ id: 'a' }] }
    })
    expect(getApiErrorPayload(error)).toMatchObject({ code: 'ACTIVE_SESSIONS', limit: 3 })
    expect(getApiErrorPayload(error).sessions).toHaveLength(1)
  })

  it('con el espejo (estándar + raíz) coincide en ambos', () => {
    const error = fail(401, { success: false, error: { code: 'ROLES_CHANGED', message: 'Tus permisos cambiaron' }, code: 'ROLES_CHANGED', message: 'Tus permisos cambiaron' })
    expect(getApiErrorPayload(error).code).toBe('ROLES_CHANGED')
    expect(getApiErrorReason(error)).toBe('Tus permisos cambiaron')
  })

  it('sin respuesta devuelve un objeto vacío', () => {
    expect(getApiErrorPayload(new Error('x'))).toEqual({})
  })
})
