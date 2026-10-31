import { describe, expect, it } from 'vitest'
import {
  ROLE_PERMISSIONS,
  canAccessFeature,
  getBackendLMSRoleName,
  getFilteredQuickActions,
  getRoleBasedNavigation,
  getUserLMSRole
} from './roleUtils'

describe('getUserLMSRole', () => {
  it('admin y super_admin son admin', () => {
    expect(getUserLMSRole(['admin'])).toBe('admin')
    expect(getUserLMSRole(['super_admin'])).toBe('admin')
  })

  it('Training Manager (con cualquier alias) es training_manager', () => {
    expect(getUserLMSRole(['Training Manager'])).toBe('training_manager')
    expect(getUserLMSRole(['training_manager'])).toBe('training_manager')
    expect(getUserLMSRole(['lms_admin'])).toBe('training_manager')
  })

  it('admin gana sobre Training Manager si el usuario tiene ambos', () => {
    expect(getUserLMSRole(['Training Manager', 'admin'])).toBe('admin')
  })

  it('cualquier otro rol, o ninguno, es user', () => {
    expect(getUserLMSRole(['employee'])).toBe('user')
    expect(getUserLMSRole(['metrologist', 'invoicing'])).toBe('user')
    expect(getUserLMSRole([])).toBe('user')
  })
})

describe('ROLE_PERMISSIONS', () => {
  it('Training Manager no puede borrar cursos, ver todos los usuarios ni gestionar roles', () => {
    const tm = ROLE_PERMISSIONS.training_manager
    expect(tm.canDeleteCourses).toBe(false)
    expect(tm.canViewAllUsers).toBe(false)
    expect(tm.canManageRoles).toBe(false)
    expect(tm.canViewSystemHealth).toBe(false)
  })

  it('user no tiene ningún permiso de gestión', () => {
    const permissions = ROLE_PERMISSIONS.user
    const granted = Object.entries(permissions).filter(
      ([key, value]) => key !== 'scopeRestrictions' && value === true
    )
    expect(granted).toEqual([])
  })

  it('admin tiene todos los permisos', () => {
    const permissions = ROLE_PERMISSIONS.admin
    const denied = Object.entries(permissions).filter(
      ([, value]) => value === false
    )
    expect(denied).toEqual([])
  })
})

describe('canAccessFeature', () => {
  it('user no accede a ninguna función de gestión', () => {
    for (const feature of [
      'course-management',
      'user-management',
      'system-health',
      'analytics',
      'reports',
      'assignments',
      'certificates'
    ]) {
      expect(canAccessFeature('user', feature)).toBe(false)
    }
  })

  it('Training Manager gestiona cursos pero no usuarios ni salud del sistema', () => {
    expect(canAccessFeature('training_manager', 'course-management')).toBe(true)
    expect(canAccessFeature('training_manager', 'user-management')).toBe(false)
    expect(canAccessFeature('training_manager', 'system-health')).toBe(false)
  })

  it('una función desconocida se niega, incluso para admin', () => {
    expect(canAccessFeature('admin', 'no-existe')).toBe(false)
  })
})

describe('getFilteredQuickActions', () => {
  const actions = [
    { id: 'create-course' },
    { id: 'analytics' },
    { id: 'reports' },
    { id: 'otra-cosa' }
  ]

  it('user solo conserva las acciones desconocidas (permitidas por defecto)', () => {
    expect(getFilteredQuickActions('user', actions).map((a) => a.id)).toEqual([
      'otra-cosa'
    ])
  })

  it('admin conserva todas', () => {
    expect(getFilteredQuickActions('admin', actions)).toHaveLength(4)
  })
})

describe('getRoleBasedNavigation', () => {
  it('user no ve ningún ítem de administración', () => {
    expect(getRoleBasedNavigation('user')).toEqual([])
  })

  it('admin y Training Manager ven los cinco ítems', () => {
    const ids = ['courses', 'assignments', 'analytics', 'reports', 'certificates']
    expect(getRoleBasedNavigation('admin').map((i) => i.id)).toEqual(ids)
    expect(getRoleBasedNavigation('training_manager').map((i) => i.id)).toEqual(
      ids
    )
  })
})

describe('getBackendLMSRoleName', () => {
  it('traduce al nombre exacto de la tabla roles (Training Manager con espacio)', () => {
    expect(getBackendLMSRoleName('admin')).toBe('admin')
    expect(getBackendLMSRoleName('training_manager')).toBe('Training Manager')
    expect(getBackendLMSRoleName('user')).toBeUndefined()
  })
})
