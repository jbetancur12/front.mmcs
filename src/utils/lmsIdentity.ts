import { UserData } from '../store/userStore'

export const LMS_ONLY_ROLE = 'lms_only'
export const TRAINING_MANAGER_ROLE = 'Training Manager'

const TRAINING_MANAGER_ALIASES = [
  TRAINING_MANAGER_ROLE,
  'training_manager',
  'lms_admin'
] as const

export type LmsExperienceRole = 'admin' | 'employee' | 'client'
export type LmsManagementRole = 'admin' | 'training_manager' | 'user'
export type LmsDashboardScope = 'admin' | 'training_manager' | 'limited'

export const LMS_ACCESS_MENU_ROLES = [
  'admin',
  'employee',
  'client',
  TRAINING_MANAGER_ROLE,
  LMS_ONLY_ROLE
] as const

export const LMS_ADMIN_ROUTE_ROLES = [
  'admin',
  TRAINING_MANAGER_ROLE,
  'training_manager'
] as const

export const normalizeLmsRoles = (roles: string[] = []): string[] => {
  const normalizedRoles = new Set<string>()

  roles.forEach((role) => {
    if (!role) {
      return
    }

    if (TRAINING_MANAGER_ALIASES.includes(role as (typeof TRAINING_MANAGER_ALIASES)[number])) {
      normalizedRoles.add(TRAINING_MANAGER_ROLE)
      return
    }

    normalizedRoles.add(role)
  })

  return [...normalizedRoles]
}

export const hasTrainingManagerRole = (roles: string[] = []): boolean => {
  return normalizeLmsRoles(roles).includes(TRAINING_MANAGER_ROLE)
}

export const hasLmsAdminAccess = (roles: string[] = []): boolean => {
  const normalizedRoles = normalizeLmsRoles(roles)
  return normalizedRoles.includes('admin') || normalizedRoles.includes(TRAINING_MANAGER_ROLE)
}

export const isLmsOnlyUser = (roles: string[] = [], lmsOnly = false): boolean => {
  return lmsOnly || normalizeLmsRoles(roles).includes(LMS_ONLY_ROLE)
}

export const getEffectiveLmsMenuRoles = (user: UserData): string[] => {
  const effectiveRoles = new Set(normalizeLmsRoles(user.rol))

  if (user.userType === 'client') {
    effectiveRoles.add('client')
  }

  if (user.userType === 'internal') {
    effectiveRoles.add('employee')
  }

  if (isLmsOnlyUser(user.rol, user.lmsOnly)) {
    effectiveRoles.add(LMS_ONLY_ROLE)
  }

  return [...effectiveRoles]
}

interface ExperienceRoleOptions {
  roles: string[]
  userType?: UserData['userType']
  canManageCourses?: boolean
}

export const getLmsExperienceRole = ({
  roles,
  userType,
  canManageCourses = false
}: ExperienceRoleOptions): LmsExperienceRole => {
  if (canManageCourses || hasLmsAdminAccess(roles)) {
    return 'admin'
  }

  return userType === 'client' ? 'client' : 'employee'
}

export const getLmsDashboardScope = (
  userRole: LmsManagementRole
): LmsDashboardScope => {
  if (userRole === 'admin') {
    return 'admin'
  }

  if (userRole === 'training_manager') {
    return 'training_manager'
  }

  return 'limited'
}
