import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import {
  hasTrainingManagerRole,
  normalizeLmsRoles
} from './lmsIdentity'

// Define LMS role types
export type LMSRole = 'admin' | 'training_manager' | 'user'
export const LMS_MANAGEMENT_ROLES = ['admin', 'Training Manager'] as const

// Define role permissions
export interface RolePermissions {
  canViewAllCourses: boolean
  canCreateCourses: boolean
  canEditCourses: boolean
  canDeleteCourses: boolean
  canViewAllUsers: boolean
  canManageAssignments: boolean
  canViewSystemHealth: boolean
  canGenerateReports: boolean
  canManageRoles: boolean
  canViewAnalytics: boolean
  canManageCertificates: boolean
  canAccessJobQueue: boolean
  scopeRestrictions?: {
    departmentOnly?: boolean
    coursesOnly?: boolean
    usersOnly?: boolean
  }
}

// Role permission definitions
export const ROLE_PERMISSIONS: Record<LMSRole, RolePermissions> = {
  admin: {
    canViewAllCourses: true,
    canCreateCourses: true,
    canEditCourses: true,
    canDeleteCourses: true,
    canViewAllUsers: true,
    canManageAssignments: true,
    canViewSystemHealth: true,
    canGenerateReports: true,
    canManageRoles: true,
    canViewAnalytics: true,
    canManageCertificates: true,
    canAccessJobQueue: true
  },
  training_manager: {
    canViewAllCourses: true,
    canCreateCourses: true,
    canEditCourses: true,
    canDeleteCourses: false,
    canViewAllUsers: false,
    canManageAssignments: true,
    canViewSystemHealth: false,
    canGenerateReports: true,
    canManageRoles: false,
    canViewAnalytics: true,
    canManageCertificates: true,
    canAccessJobQueue: false,
    scopeRestrictions: {
      coursesOnly: true,
      usersOnly: true
    }
  },
  user: {
    canViewAllCourses: false,
    canCreateCourses: false,
    canEditCourses: false,
    canDeleteCourses: false,
    canViewAllUsers: false,
    canManageAssignments: false,
    canViewSystemHealth: false,
    canGenerateReports: false,
    canManageRoles: false,
    canViewAnalytics: false,
    canManageCertificates: false,
    canAccessJobQueue: false
  }
}

/**
 * Get user's LMS role based on their roles array
 */
export const getUserLMSRole = (userRoles: string[]): LMSRole => {
  const normalizedRoles = normalizeLmsRoles(userRoles)

  if (normalizedRoles.includes('admin') || normalizedRoles.includes('super_admin')) {
    return 'admin'
  }
  if (hasTrainingManagerRole(normalizedRoles)) {
    return 'training_manager'
  }
  return 'user'
}

/**
 * Map frontend-normalized LMS role to the backend role label when a request
 * needs to filter by role name.
 */
export const getBackendLMSRoleName = (role: LMSRole): string | undefined => {
  switch (role) {
    case 'admin':
      return 'admin'
    case 'training_manager':
      return 'Training Manager'
    default:
      return undefined
  }
}

/**
 * Hook to get current user's LMS role
 */
export const useUserLMSRole = (): LMSRole => {
  const $userStore = useStore(userStore)
  const userRoles = $userStore?.rol ?? []
  return getUserLMSRole(userRoles)
}

/**
 * Hook to get current user's permissions
 */
export const useUserPermissions = (): RolePermissions => {
  const role = useUserLMSRole()
  return ROLE_PERMISSIONS[role]
}

/**
 * Hook to check if user has specific permission
 */
export const useHasPermission = (permission: keyof RolePermissions): boolean => {
  const permissions = useUserPermissions()
  return Boolean(permissions[permission])
}

/**
 * Check if user can access a specific feature
 */
export const canAccessFeature = (userRole: LMSRole, feature: string): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole]
  
  switch (feature) {
    case 'course-management':
      return permissions.canCreateCourses || permissions.canEditCourses
    case 'user-management':
      return permissions.canViewAllUsers
    case 'system-health':
      return permissions.canViewSystemHealth
    case 'job-queue':
      return permissions.canAccessJobQueue
    case 'analytics':
      return permissions.canViewAnalytics
    case 'reports':
      return permissions.canGenerateReports
    case 'assignments':
      return permissions.canManageAssignments
    case 'certificates':
      return permissions.canManageCertificates
    default:
      return false
  }
}

/**
 * Get filtered quick actions based on user role
 */
export const getFilteredQuickActions = (userRole: LMSRole, allActions: any[]) => {
  const permissions = ROLE_PERMISSIONS[userRole]
  
  return allActions.filter(action => {
    switch (action.id) {
      case 'create-course':
        return permissions.canCreateCourses
      case 'course-management':
        return permissions.canViewAllCourses || permissions.canEditCourses
      case 'assignments':
        return permissions.canManageAssignments
      case 'analytics':
        return permissions.canViewAnalytics
      case 'reports':
        return permissions.canGenerateReports
      case 'certificates':
        return permissions.canManageCertificates
      case 'jobs':
        return permissions.canAccessJobQueue
      default:
        return true // Allow by default for unknown actions
    }
  })
}

/**
 * Get role-appropriate navigation items
 */
export const getRoleBasedNavigation = (userRole: LMSRole) => {
  const permissions = ROLE_PERMISSIONS[userRole]
  
  const navigation = []
  
  if (permissions.canViewAllCourses || permissions.canCreateCourses) {
    navigation.push({
      id: 'courses',
      label: 'Cursos',
      path: '/lms/admin/courses',
      icon: 'SchoolIcon'
    })
  }
  
  if (permissions.canManageAssignments) {
    navigation.push({
      id: 'assignments',
      label: 'Asignaciones',
      path: '/lms/admin/assignments',
      icon: 'AssignmentIcon'
    })
  }
  
  if (permissions.canViewAnalytics) {
    navigation.push({
      id: 'analytics',
      label: 'Analíticas',
      path: '/lms/admin/analytics',
      icon: 'AnalyticsIcon'
    })
  }
  
  if (permissions.canGenerateReports) {
    navigation.push({
      id: 'reports',
      label: 'Reportes',
      path: '/lms/admin/reporting',
      icon: 'AssessmentIcon'
    })
  }
  
  if (permissions.canManageCertificates) {
    navigation.push({
      id: 'certificates',
      label: 'Certificados',
      path: '/lms/admin/certificate-templates',
      icon: 'CertificateIcon'
    })
  }
  
  if (permissions.canAccessJobQueue) {
    navigation.push({
      id: 'jobs',
      label: 'Sistema Jobs',
      path: '/lms/admin/jobs',
      icon: 'SettingsIcon'
    })
  }
  
  return navigation
}

/**
 * Get role display information
 */
export const getRoleDisplayInfo = (role: LMSRole) => {
  const roleInfo = {
    admin: {
      label: 'Administrador del Sistema',
      description: 'Acceso completo a todas las funcionalidades',
      color: '#dc2626'
    },
    training_manager: {
      label: 'Gestor de Capacitación',
      description: 'Gestión de cursos y capacitación',
      color: '#059669'
    },
    user: {
      label: 'Usuario',
      description: 'Acceso básico a cursos asignados',
      color: '#6b7280'
    }
  }
  
  return roleInfo[role]
}
