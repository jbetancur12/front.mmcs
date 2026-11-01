import { headerText } from './responseHeaders'

describe('headerText', () => {
  it('lee una cabecera de un objeto plano', () => {
    expect(
      headerText({ 'content-type': 'application/pdf' }, 'content-type')
    ).toBe('application/pdf')
  })

  it('usa get() cuando es un AxiosHeaders', () => {
    const headers = {
      get: (name: string) => (name === 'content-type' ? 'video/mp4' : undefined)
    }
    expect(headerText(headers, 'content-type')).toBe('video/mp4')
  })

  it('devuelve undefined si no viene o no hay cabeceras', () => {
    expect(headerText({}, 'content-type')).toBeUndefined()
    expect(headerText(undefined, 'content-type')).toBeUndefined()
    expect(headerText(null, 'content-type')).toBeUndefined()
    expect(headerText('texto', 'content-type')).toBeUndefined()
  })

  it('convierte números y listas en texto', () => {
    expect(headerText({ 'content-length': 120 }, 'content-length')).toBe('120')
    expect(headerText({ 'set-cookie': ['a=1', 'b=2'] }, 'set-cookie')).toBe(
      'a=1, b=2'
    )
  })

  it('no trata false como un valor', () => {
    expect(headerText({ x: false }, 'x')).toBeUndefined()
  })
})
