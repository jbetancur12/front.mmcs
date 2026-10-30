import { getRequestId, shouldReportClientError } from './clientErrors'

describe('getRequestId', () => {
  it('lee la cabecera X-Request-ID de la respuesta', () => {
    const error = {
      response: { status: 500, headers: { 'x-request-id': 'abc-123' } }
    }
    expect(getRequestId(error)).toBe('abc-123')
  })

  it('lee la cabecera de un objeto con get()', () => {
    const headers = {
      get: (name: string) => (name === 'x-request-id' ? 'req-9' : undefined)
    }
    expect(getRequestId({ response: { headers } })).toBe('req-9')
  })

  it('cae al requestId del cuerpo', () => {
    const error = {
      response: { status: 500, data: { success: false, requestId: 'body-1' } }
    }
    expect(getRequestId(error)).toBe('body-1')
  })

  it('devuelve null sin respuesta o sin id', () => {
    expect(getRequestId(new Error('sin red'))).toBeNull()
    expect(getRequestId({ response: { status: 500, data: {} } })).toBeNull()
    expect(getRequestId(null)).toBeNull()
  })
})

describe('shouldReportClientError', () => {
  it('reporta errores de código', () => {
    expect(shouldReportClientError(new TypeError('x is undefined'))).toBe(true)
  })

  it('reporta respuestas 5xx del API', () => {
    expect(
      shouldReportClientError({ isAxiosError: true, response: { status: 500 } })
    ).toBe(true)
  })

  it('no reporta 4xx (sesión, permisos, validación) ni cancelaciones', () => {
    expect(
      shouldReportClientError({ isAxiosError: true, response: { status: 401 } })
    ).toBe(false)
    expect(
      shouldReportClientError({ isAxiosError: true, response: { status: 403 } })
    ).toBe(false)
    expect(
      shouldReportClientError({ isAxiosError: true, code: 'ERR_CANCELED' })
    ).toBe(false)
  })

  it('no reporta avisos benignos del navegador', () => {
    expect(
      shouldReportClientError(
        new Error(
          'ResizeObserver loop completed with undelivered notifications.'
        )
      )
    ).toBe(false)
    expect(shouldReportClientError('Script error.')).toBe(false)
  })
})
