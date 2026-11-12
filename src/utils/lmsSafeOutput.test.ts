import { describe, expect, it } from 'vitest'
import { buildLmsResourceUrl, escapeHtml } from './lmsSafeOutput'

describe('escapeHtml', () => {
  it('escapa etiquetas, comillas y ampersands', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;'
    )
  })

  it('devuelve cadena vacía con null o undefined y convierte números', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(42)).toBe('42')
  })
})

describe('buildLmsResourceUrl', () => {
  const api = 'https://api.metromedics.test'

  it('agrega el token a una ruta relativa del API', () => {
    expect(buildLmsResourceUrl('/lms/files/a.pdf', 'T', api)).toBe(
      'https://api.metromedics.test/lms/files/a.pdf?token=T'
    )
  })

  it('agrega el token a una URL absoluta del propio API', () => {
    expect(
      buildLmsResourceUrl('https://api.metromedics.test/x?y=1', 'T', api)
    ).toBe('https://api.metromedics.test/x?y=1&token=T')
  })

  it('no manda el token a otro origen', () => {
    const url = buildLmsResourceUrl('https://evil.example/file.pdf', 'T', api)
    expect(url).toBe('https://evil.example/file.pdf')
    expect(url).not.toContain('token')
  })

  it('no confunde un subdominio parecido con el API', () => {
    const url = buildLmsResourceUrl(
      'https://api.metromedics.test.evil.example/x',
      'T',
      api
    )
    expect(url).not.toContain('token')
  })

  it('rechaza esquemas que no son http(s) y valores vacíos', () => {
    expect(buildLmsResourceUrl('javascript:alert(1)', 'T', api)).toBeNull()
    expect(buildLmsResourceUrl('', 'T', api)).toBeNull()
    expect(buildLmsResourceUrl(null, 'T', api)).toBeNull()
  })

  it('sin token devuelve la URL tal cual', () => {
    expect(buildLmsResourceUrl('/a', null, api)).toBe(
      'https://api.metromedics.test/a'
    )
  })
})
