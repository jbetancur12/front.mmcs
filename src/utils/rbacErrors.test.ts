import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { parseRbacError, rbacErrorMessage } from './rbacErrors'

const axiosFail = (status: number, data: unknown) =>
  new AxiosError('fallo', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: {}
  } as unknown as AxiosResponse)

describe('parseRbacError', () => {
  it('traduce cada código estable a su mensaje en español', () => {
    const error = axiosFail(409, { error: { code: 'ROLE_EXISTS' } })
    expect(parseRbacError(error)).toMatchObject({
      status: 409,
      code: 'ROLE_EXISTS',
      message: 'Ya existe un rol con ese nombre.'
    })
  })

  it('cubre los demás códigos conocidos', () => {
    for (const code of [
      'SENSITIVE_PERMISSION',
      'SELF_ESCALATION',
      'LAST_RBAC_MANAGER',
      'SYSTEM_ROLE',
      'ROLE_NOT_FOUND',
      'INVALID_ROLE_NAME',
      'UNKNOWN_PERMISSION',
      'CONFLICTING_CHANGES'
    ]) {
      const { message } = parseRbacError(axiosFail(400, { error: { code } }))
      expect(message.length).toBeGreaterThan(10)
      expect(message).not.toBe(code)
    }
  })

  it('un código desconocido usa el motivo que da la API', () => {
    const error = axiosFail(400, {
      error: { code: 'NUEVO', message: 'Motivo del servidor' }
    })
    expect(parseRbacError(error).message).toBe('Motivo del servidor')
  })

  it('un 403 sin detalle dice que no tiene permiso', () => {
    expect(parseRbacError(axiosFail(403, {})).message).toBe(
      'No tienes permiso para realizar este cambio.'
    )
  })

  it('otro error sin detalle da el mensaje genérico', () => {
    expect(parseRbacError(axiosFail(500, {})).message).toBe(
      'No se pudo completar la operación. Intenta de nuevo.'
    )
  })

  it('un error que no es de axios da el mensaje genérico, sin estado', () => {
    expect(parseRbacError(new Error('x'))).toEqual({
      message: 'No se pudo completar la operación. Intenta de nuevo.'
    })
    expect(parseRbacError(null).status).toBeUndefined()
  })

  it('pasa los detalles con claves y descarta los que son lista', () => {
    const withKeys = axiosFail(400, {
      error: { code: 'UNKNOWN_PERMISSION', details: { keys: ['a.b'] } }
    })
    expect(parseRbacError(withKeys).details).toEqual({ keys: ['a.b'] })

    const asList = axiosFail(400, {
      error: { code: 'X', details: [{ field: 'name', message: 'mal' }] }
    })
    expect(parseRbacError(asList).details).toBeUndefined()
  })
})

describe('rbacErrorMessage', () => {
  it('devuelve solo el texto', () => {
    expect(
      rbacErrorMessage(axiosFail(409, { error: { code: 'SYSTEM_ROLE' } }))
    ).toBe('Los roles de sistema no se pueden desactivar.')
  })
})
