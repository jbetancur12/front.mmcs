import { describe, expect, it } from 'vitest'
import {
  ROLES,
  ROLE_GROUPS,
  ROLE_LABELS_ES,
  getRoleLabelEs,
  hasAnyRole
} from './roles'

describe('ROLES y ROLE_LABELS_ES', () => {
  it('todo rol de ROLES tiene etiqueta en español', () => {
    const sinEtiqueta = Object.values(ROLES).filter(
      (role) => !(role in ROLE_LABELS_ES)
    )
    expect(sinEtiqueta).toEqual([])
  })

  it('no hay etiquetas de roles que ya no existen en ROLES', () => {
    const roles: string[] = Object.values(ROLES)
    const huerfanas = Object.keys(ROLE_LABELS_ES).filter(
      (role) => !roles.includes(role)
    )
    expect(huerfanas).toEqual([])
  })

  it('Training Manager lleva espacio y mayúsculas (nombre exacto de la tabla roles)', () => {
    expect(ROLES.TRAINING_MANAGER).toBe('Training Manager')
  })
})

describe('getRoleLabelEs', () => {
  it('devuelve la etiqueta, o el nombre crudo si no está mapeado', () => {
    expect(getRoleLabelEs('metrologist')).toBe('Metrólogo')
    expect(getRoleLabelEs('rol_nuevo')).toBe('rol_nuevo')
  })

  it('devuelve vacío sin rol', () => {
    expect(getRoleLabelEs(undefined)).toBe('')
    expect(getRoleLabelEs(null)).toBe('')
    expect(getRoleLabelEs('')).toBe('')
  })
})

describe('hasAnyRole', () => {
  it('true si algún rol del usuario está permitido', () => {
    expect(hasAnyRole([ROLES.EMPLOYEE, ROLES.ADMIN], ROLE_GROUPS.ADMINS)).toBe(true)
  })

  it('false si ninguno coincide', () => {
    expect(hasAnyRole([ROLES.EMPLOYEE], ROLE_GROUPS.ADMINS)).toBe(false)
  })

  it('false con roles nulos, indefinidos o vacíos, o sin lista permitida', () => {
    expect(hasAnyRole(null, ROLE_GROUPS.ADMINS)).toBe(false)
    expect(hasAnyRole(undefined, ROLE_GROUPS.ADMINS)).toBe(false)
    expect(hasAnyRole([], ROLE_GROUPS.ADMINS)).toBe(false)
    expect(hasAnyRole([ROLES.ADMIN], [])).toBe(false)
  })

  it('distingue mayúsculas: "training manager" no es "Training Manager"', () => {
    expect(hasAnyRole(['training manager'], [ROLES.TRAINING_MANAGER])).toBe(
      false
    )
  })
})

describe('ROLE_GROUPS', () => {
  it('ADMINS es exactamente admin y super_admin', () => {
    expect([...ROLE_GROUPS.ADMINS].sort()).toEqual(['admin', 'super_admin'])
  })

  it('los grupos solo contienen roles que existen en ROLES', () => {
    const roles: string[] = Object.values(ROLES)
    for (const [grupo, lista] of Object.entries(ROLE_GROUPS)) {
      const desconocidos = lista.filter((role) => !roles.includes(role))
      expect({ grupo, desconocidos }).toEqual({ grupo, desconocidos: [] })
    }
  })
})
