import { useQuery } from 'react-query'
import { lmsService, RoleBasedFilter } from '../services/lmsService'
import {
  getBackendLMSRoleName,
  useUserLMSRole,
  useUserPermissions
} from '../utils/roleUtils'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'

/**
 * Hook for role-based dashboard data
 */
export const useRoleBasedDashboard = (additionalFilters?: Partial<RoleBasedFilter>) => {
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const $userStore = useStore(userStore)
  const backendRole = getBackendLMSRoleName(userRole) ?? userRole

  const filters: RoleBasedFilter = {
    userRole: backendRole,
    scope: permissions.scopeRestrictions?.departmentOnly ? 'department' : 
           permissions.scopeRestrictions?.coursesOnly ? 'courses' : 'all',
    managedOnly: userRole !== 'admin',
    department: $userStore.customer?.nombre || undefined,
    ...additionalFilters
  }

  return useQuery(
    ['roleBasedDashboard', filters],
    () => lmsService.getRoleBasedDashboard(filters),
    {
      enabled: !!userRole,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  )
}

/**
 * Hook for role-based filtered courses
 */
export const useRoleBasedCourses = (
  options?: {
    limit?: number
    offset?: number
    status?: 'draft' | 'published' | 'archived'
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
  }
) => {
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const $userStore = useStore(userStore)
  const backendRole = getBackendLMSRoleName(userRole) ?? userRole

  const filters: RoleBasedFilter & {
    limit?: number
    offset?: number
    status?: 'draft' | 'published' | 'archived'
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
  } = {
    userRole: backendRole,
    scope: permissions.scopeRestrictions?.coursesOnly ? 'courses' : 'all',
    managedOnly: userRole !== 'admin',
    department: permissions.scopeRestrictions?.departmentOnly ? 
                $userStore.customer?.nombre : undefined,
    ...options
  }

  return useQuery(
    ['roleBasedCourses', filters],
    () => lmsService.getFilteredCourses(filters),
    {
      enabled: !!userRole && permissions.canViewAllCourses,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  )
}

/**
 * Hook for role-based user analytics
 */
export const useRoleBasedUserAnalytics = (additionalFilters?: Partial<RoleBasedFilter>) => {
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const $userStore = useStore(userStore)
  const backendRole = getBackendLMSRoleName(userRole) ?? userRole

  const filters: RoleBasedFilter = {
    userRole: backendRole,
    scope: permissions.scopeRestrictions?.departmentOnly ? 'department' : 
           permissions.scopeRestrictions?.usersOnly ? 'users' : 'all',
    managedOnly: userRole !== 'admin',
    department: permissions.scopeRestrictions?.departmentOnly ? 
                $userStore.customer?.nombre : undefined,
    ...additionalFilters
  }

  return useQuery(
    ['roleBasedUserAnalytics', filters],
    () => lmsService.getFilteredUserAnalytics(filters),
    {
      enabled: !!userRole && permissions.canViewAnalytics,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  )
}

/**
 * Hook for department-specific analytics
 */
export const useDepartmentAnalytics = (
  department?: string,
  options?: {
    dateRange?: string
    includeSubDepartments?: boolean
  }
) => {
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const $userStore = useStore(userStore)

  // Use provided department or user's department
  const targetDepartment = department || $userStore.customer?.nombre

  return useQuery(
    ['departmentAnalytics', targetDepartment, options],
    () => lmsService.getDepartmentAnalytics(targetDepartment!, options),
    {
      enabled: !!targetDepartment && 
               !!userRole && 
               (permissions.scopeRestrictions?.departmentOnly || userRole === 'admin'),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  )
}

/**
 * Hook for role-based assignment analytics
 */
export const useRoleBasedAssignments = (additionalFilters?: {
  status?: string
  startDate?: string
  endDate?: string
}) => {
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const $userStore = useStore(userStore)
  const backendRole = getBackendLMSRoleName(userRole) ?? userRole

  const filters = {
    role: backendRole,
    department: permissions.scopeRestrictions?.departmentOnly ? 
                $userStore.customer?.nombre : undefined,
    ...additionalFilters
  }

  return useQuery(
    ['roleBasedAssignments', filters],
    () => lmsService.getAssignmentManagementAnalytics(filters),
    {
      enabled: !!userRole && permissions.canManageAssignments,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  )
}

/**
 * Hook for role-based mandatory training status
 */
export const useRoleBasedMandatoryTraining = (additionalFilters?: {
  userId?: number
  includeCompleted?: boolean
}) => {
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const backendRole = getBackendLMSRoleName(userRole) ?? userRole

  const filters = {
    role: backendRole,
    ...additionalFilters
  }

  return useQuery(
    ['roleBasedMandatoryTraining', filters],
    () => lmsService.getMandatoryTrainingStatus(filters),
    {
      enabled: !!userRole && permissions.canViewAnalytics,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  )
}

/**
 * Utility function to filter data based on user role and permissions
 */
export const filterDataByRole = <T extends Record<string, any>>(
  data: T[],
  userRole: string,
  permissions: any,
  filterKey: keyof T = 'department' as keyof T
): T[] => {
  if (!data || !Array.isArray(data)) return []
  
  // Admin sees everything
  if (userRole === 'admin') return data
  
  // Department managers see only their department
  if (permissions.scopeRestrictions?.departmentOnly) {
    return data.filter(item => 
      item[filterKey] === permissions.department ||
      item.assigned_to_department === permissions.department
    )
  }
  
  // Training managers see courses they manage
  if (permissions.scopeRestrictions?.coursesOnly) {
    return data.filter(item => 
      item.created_by === permissions.userId ||
      item.managed_by === permissions.userId
    )
  }
  
  return data
}

/**
 * Utility function to get role-appropriate quick actions
 */
export const getRoleBasedQuickActions = (userRole: string, permissions: any) => {
  void userRole
  const baseActions = [
    {
      id: 'view-courses',
      title: 'Ver Cursos',
      enabled: permissions.canViewAllCourses,
      scope: permissions.scopeRestrictions?.coursesOnly ? 'managed' : 'all'
    },
    {
      id: 'create-course',
      title: 'Crear Curso',
      enabled: permissions.canCreateCourses,
      scope: 'all'
    },
    {
      id: 'manage-assignments',
      title: 'Gestionar Asignaciones',
      enabled: permissions.canManageAssignments,
      scope: permissions.scopeRestrictions?.departmentOnly ? 'department' : 'all'
    },
    {
      id: 'view-analytics',
      title: 'Ver Analíticas',
      enabled: permissions.canViewAnalytics,
      scope: permissions.scopeRestrictions?.departmentOnly ? 'department' : 'all'
    },
    {
      id: 'generate-reports',
      title: 'Generar Reportes',
      enabled: permissions.canGenerateReports,
      scope: permissions.scopeRestrictions?.departmentOnly ? 'department' : 'all'
    }
  ]

  return baseActions.filter(action => action.enabled)
}
