import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearLocalSession,
  clearSessionEnded,
  getSessionRevokedReason,
  getTokenSessionId,
  isReauthRequired,
  isRolesChangedError,
  peekSessionEndedMessage,
  rememberSessionEnded
} from './sessionEnd'

const fail = (data: unknown) => ({ response: { status: 401, data } })

const tokenWith = (payload: unknown) => {
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `cabecera.${body}.firma`
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('detección de errores de sesión', () => {
  it('getSessionRevokedReason devuelve el motivo si es SESSION_REVOKED', () => {
    expect(
      getSessionRevokedReason(
        fail({ error: { code: 'SESSION_REVOKED', reason: 'replaced' } })
      )
    ).toBe('replaced')
    // formato viejo, con el código en la raíz
    expect(
      getSessionRevokedReason(fail({ code: 'SESSION_REVOKED', reason: 'manual' }))
    ).toBe('manual')
  })

  it('sin motivo, SESSION_REVOKED devuelve "revoked"', () => {
    expect(getSessionRevokedReason(fail({ code: 'SESSION_REVOKED' }))).toBe(
      'revoked'
    )
  })

  it('otro código o un valor que no es un error devuelven null', () => {
    expect(getSessionRevokedReason(fail({ code: 'OTRO' }))).toBeNull()
    expect(getSessionRevokedReason(null)).toBeNull()
    expect(getSessionRevokedReason(new Error('x'))).toBeNull()
  })

  it('isRolesChangedError e isReauthRequired miran el código exacto', () => {
    expect(isRolesChangedError(fail({ error: { code: 'ROLES_CHANGED' } }))).toBe(
      true
    )
    expect(isRolesChangedError(fail({ code: 'OTRO' }))).toBe(false)
    expect(isReauthRequired(fail({ code: 'SESSION_REAUTH_REQUIRED' }))).toBe(
      true
    )
    expect(isReauthRequired(fail({ code: 'ROLES_CHANGED' }))).toBe(false)
  })
})

describe('aviso de sesión cerrada para el login', () => {
  it('sin motivo guardado no hay mensaje', () => {
    expect(peekSessionEndedMessage()).toBeNull()
  })

  it('cada motivo conocido tiene su mensaje', () => {
    rememberSessionEnded('replaced')
    expect(peekSessionEndedMessage()).toBe(
      'Tu sesión se cerró porque ingresaste desde otro equipo.'
    )
    rememberSessionEnded('password_changed')
    expect(peekSessionEndedMessage()).toContain('Cambiaron tu contraseña')
    rememberSessionEnded('deactivated')
    expect(peekSessionEndedMessage()).toContain('desactivada')
  })

  it('un motivo desconocido usa el mensaje genérico', () => {
    rememberSessionEnded('algo_raro')
    expect(peekSessionEndedMessage()).toBe('Tu sesión se cerró.')
  })

  it('un cierre normal (logout) no deja mensaje', () => {
    rememberSessionEnded('logout')
    expect(peekSessionEndedMessage()).toBeNull()
  })

  it('peek no borra el aviso (React lo lee dos veces); clear sí', () => {
    rememberSessionEnded('manual')
    expect(peekSessionEndedMessage()).not.toBeNull()
    expect(peekSessionEndedMessage()).not.toBeNull()
    clearSessionEnded()
    expect(peekSessionEndedMessage()).toBeNull()
  })
})

describe('getTokenSessionId', () => {
  it('lee el sid del payload', () => {
    expect(getTokenSessionId(tokenWith({ sid: 'abc-123' }))).toBe('abc-123')
  })

  it('devuelve null si no trae sid o no es texto', () => {
    expect(getTokenSessionId(tokenWith({ sub: 1 }))).toBeNull()
    expect(getTokenSessionId(tokenWith({ sid: 42 }))).toBeNull()
  })

  it('devuelve null con un token malformado, sin lanzar error', () => {
    expect(getTokenSessionId('')).toBeNull()
    expect(getTokenSessionId('sin-puntos')).toBeNull()
    expect(getTokenSessionId('a.%%%.c')).toBeNull()
  })
})

describe('clearLocalSession', () => {
  it('limpia localStorage y sessionStorage', () => {
    localStorage.setItem('accessToken', 'x')
    sessionStorage.setItem('lastLocation', '/customers')
    clearLocalSession()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
