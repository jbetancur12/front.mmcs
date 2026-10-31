import { describe, expect, it } from 'vitest'
import { ROLES } from 'src/constants/roles'
import type { UserData } from '../store/userStore'
import {
  getEffectiveLmsMenuRoles,
  getLmsDashboardScope,
  getLmsExperienceRole,
  getPreferredPostLoginRoute,
  hasLmsAdminAccess,
  hasTrainingManagerRole,
  isLmsOnlyUser,
  normalizeLmsRoles
} from './lmsIdentity'

const user = (data: Record<string, unknown>) => data as unknown as UserData

describe('normalizeLmsRoles', () => {
  it('unifica los alias de Training Manager en el nombre canónico (con espacio)', () => {
    expect(normalizeLmsRoles(['training_manager'])).toEqual(['Training Manager'])
    expect(normalizeLmsRoles(['lms_admin'])).toEqual(['Training Manager'])
    expect(normalizeLmsRoles(['Training Manager'])).toEqual(['Training Manager'])
  })

  it('quita duplicados y valores vacíos, y conserva el resto', () => {
    expect(
      normalizeLmsRoles(['admin', '', 'training_manager', 'Training Manager'])
    ).toEqual(['admin', 'Training Manager'])
  })

  it('sin argumentos devuelve una lista vacía', () => {
    expect(normalizeLmsRoles()).toEqual([])
  })
})

describe('accesos del LMS', () => {
  it('hasTrainingManagerRole reconoce cualquier alias', () => {
    expect(hasTrainingManagerRole(['lms_admin'])).toBe(true)
    expect(hasTrainingManagerRole(['admin'])).toBe(false)
  })

  it('hasLmsAdminAccess: admin y Training Manager sí; empleado y super_admin no', () => {
    expect(hasLmsAdminAccess(['admin'])).toBe(true)
    expect(hasLmsAdminAccess(['training_manager'])).toBe(true)
    expect(hasLmsAdminAccess(['employee'])).toBe(false)
    // super_admin no entra por esta vía: la regla actual solo mira admin y Training Manager
    expect(hasLmsAdminAccess(['super_admin'])).toBe(false)
  })

  it('isLmsOnlyUser: por rol o por la marca lmsOnly', () => {
    expect(isLmsOnlyUser(['lms_only'])).toBe(true)
    expect(isLmsOnlyUser(['employee'], true)).toBe(true)
    expect(isLmsOnlyUser(['employee'])).toBe(false)
  })
})

describe('getEffectiveLmsMenuRoles', () => {
  it('un usuario de empresa cliente suma el rol client', () => {
    const roles = getEffectiveLmsMenuRoles(
      user({ rol: ['user'], userType: 'client' })
    )
    expect(roles).toContain('client')
    expect(roles).not.toContain('employee')
  })

  it('un usuario interno suma el rol employee', () => {
    const roles = getEffectiveLmsMenuRoles(
      user({ rol: ['metrologist'], userType: 'internal' })
    )
    expect(roles).toContain('employee')
    expect(roles).not.toContain('client')
  })

  it('suma lms_only con la marca lmsOnly y normaliza Training Manager', () => {
    const roles = getEffectiveLmsMenuRoles(
      user({ rol: ['training_manager'], userType: 'internal', lmsOnly: true })
    )
    expect(roles).toEqual(
      expect.arrayContaining(['Training Manager', 'employee', 'lms_only'])
    )
  })
})

describe('getLmsExperienceRole', () => {
  it('quien administra el LMS ve la experiencia admin', () => {
    expect(getLmsExperienceRole({ roles: [ROLES.ADMIN] })).toBe('admin')
    expect(getLmsExperienceRole({ roles: ['training_manager'] })).toBe('admin')
  })

  it('canManageCourses fuerza la experiencia admin', () => {
    expect(
      getLmsExperienceRole({ roles: [ROLES.EMPLOYEE], canManageCourses: true })
    ).toBe('admin')
  })

  it('sin permisos de gestión: client para empresas, employee para el resto', () => {
    expect(getLmsExperienceRole({ roles: [ROLES.USER], userType: 'client' })).toBe(
      'client'
    )
    expect(
      getLmsExperienceRole({ roles: [ROLES.EMPLOYEE], userType: 'internal' })
    ).toBe('employee')
    expect(getLmsExperienceRole({ roles: [] })).toBe('employee')
  })
})

describe('getLmsDashboardScope', () => {
  it('mapea cada rol de gestión a su alcance', () => {
    expect(getLmsDashboardScope('admin')).toBe('admin')
    expect(getLmsDashboardScope('training_manager')).toBe('training_manager')
    expect(getLmsDashboardScope('user')).toBe('limited')
  })
})

describe('getPreferredPostLoginRoute', () => {
  it('respeta la última ruta útil', () => {
    expect(getPreferredPostLoginRoute({ lastLocation: '/customers' })).toBe(
      '/customers'
    )
  })

  it('una última ruta sin sentido no pisa el portal de un usuario solo-LMS', () => {
    for (const lastLocation of ['/', '/login', '/not-authorized']) {
      expect(
        getPreferredPostLoginRoute({
          lastLocation,
          roles: [ROLES.LMS_ONLY],
          userType: 'internal'
        })
      ).toBe('/lms/employee')
    }
  })

  it('un usuario normal con una última ruta sin sentido va al inicio, no de vuelta al login', () => {
    for (const lastLocation of ['/login', '/not-authorized']) {
      expect(getPreferredPostLoginRoute({ lastLocation })).toBe('/')
    }
  })

  it('sin última ruta, un usuario normal va al inicio', () => {
    expect(getPreferredPostLoginRoute({ lastLocation: '/' })).toBe('/')
    expect(getPreferredPostLoginRoute({ lastLocation: null })).toBe('/')
  })

  it('un usuario solo-LMS va a su portal según el tipo de usuario', () => {
    expect(
      getPreferredPostLoginRoute({ roles: [ROLES.LMS_ONLY], userType: 'client' })
    ).toBe('/lms/client')
    expect(
      getPreferredPostLoginRoute({ roles: [ROLES.LMS_ONLY], userType: 'internal' })
    ).toBe('/lms/employee')
    expect(getPreferredPostLoginRoute({ lmsOnly: true })).toBe('/lms/employee')
  })

  it('un usuario normal sin última ruta va al inicio', () => {
    expect(getPreferredPostLoginRoute({ roles: [ROLES.ADMIN] })).toBe('/')
  })
})
