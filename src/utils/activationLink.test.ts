import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildActivationWhatsappUrl,
  copyToClipboard,
  normalizeWhatsappPhone
} from './activationLink'

describe('normalizeWhatsappPhone', () => {
  it('un celular colombiano de 10 dígitos recibe el prefijo 57', () => {
    expect(normalizeWhatsappPhone('3001234567')).toBe('573001234567')
  })

  it('un número que ya trae el 57 se deja igual', () => {
    expect(normalizeWhatsappPhone('573001234567')).toBe('573001234567')
  })

  it('quita espacios, guiones, paréntesis y el signo +', () => {
    expect(normalizeWhatsappPhone('+57 300 123 4567')).toBe('573001234567')
    expect(normalizeWhatsappPhone('(300) 123-4567')).toBe('573001234567')
  })

  it('un número internacional de 11 dígitos o más se respeta', () => {
    expect(normalizeWhatsappPhone('14155550123')).toBe('14155550123')
  })

  it('devuelve vacío si no es usable', () => {
    expect(normalizeWhatsappPhone('1234567')).toBe('')
    expect(normalizeWhatsappPhone('6011234567')).toBe('') // fijo de 10 dígitos
    expect(normalizeWhatsappPhone('')).toBe('')
    expect(normalizeWhatsappPhone(null)).toBe('')
    expect(normalizeWhatsappPhone(undefined)).toBe('')
  })
})

describe('buildActivationWhatsappUrl', () => {
  const info = {
    nombre: 'Ana',
    email: 'ana@example.com',
    phone: '3001234567',
    activationUrl: 'https://app.example.com/activar?token=abc&x=1'
  }

  it('arma el enlace a wa.me con el teléfono normalizado', () => {
    expect(buildActivationWhatsappUrl(info)).toMatch(
      /^https:\/\/wa\.me\/573001234567\?text=/
    )
  })

  it('el mensaje saluda por nombre e incluye el enlace de activación', () => {
    const url = buildActivationWhatsappUrl(info)
    const text = decodeURIComponent(url.split('?text=')[1])
    expect(text).toContain('Hola Ana, ')
    expect(text).toContain(info.activationUrl)
  })

  it('el texto va codificado para que & y ? del enlace no rompan la URL', () => {
    const url = buildActivationWhatsappUrl(info)
    expect(url.split('?text=')[1]).not.toContain('&x=1')
    expect(url.split('?text=')[1]).toContain(encodeURIComponent('&x=1'))
  })

  it('sin nombre saluda de forma genérica', () => {
    const text = decodeURIComponent(
      buildActivationWhatsappUrl({ ...info, nombre: null }).split('?text=')[1]
    )
    expect(text.startsWith('Hola, ')).toBe(true)
  })

  it('sin teléfono usable el enlace queda sin número', () => {
    expect(buildActivationWhatsappUrl({ ...info, phone: null })).toMatch(
      /^https:\/\/wa\.me\/\?text=/
    )
  })
})

describe('copyToClipboard', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard')
    Reflect.deleteProperty(document, 'execCommand')
    vi.restoreAllMocks()
  })

  it('usa la API del portapapeles si existe', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })
    await expect(copyToClipboard('hola')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hola')
  })

  it('si la API falla, copia con el método de respaldo y limpia el campo', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denegado')) },
      configurable: true
    })
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true
    })
    await expect(copyToClipboard('hola')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('sin API del portapapeles también usa el respaldo, y devuelve false si falla', async () => {
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true
    })
    await expect(copyToClipboard('hola')).resolves.toBe(false)
  })
})
