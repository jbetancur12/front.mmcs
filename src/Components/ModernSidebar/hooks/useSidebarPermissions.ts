import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import { userStore, UserData } from '../../../store/userStore'
import { ModernSidebarItem } from '../types/sidebar.types'
import { audienceIncludes } from '../../../constants/modules'

const getUserType = ($user: UserData | null): 'internal' | 'client' =>
  $user?.customer ? 'client' : 'internal'

export const useSidebarPermissions = () => {
  const $userStore = useStore(userStore)

  // Cache para permisos calculados
  const permissionsCache = useMemo(() => new Map<string, boolean>(), [])

  const canViewModule = useMemo(() => {
    return (roles: string[], userRoles: string[]): boolean => {
      const cacheKey = `${roles.join(',')}-${userRoles.join(',')}`
      
      if (permissionsCache.has(cacheKey)) {
        return permissionsCache.get(cacheKey)!
      }
      
      const hasPermission = userRoles.some((role) => roles.includes(role))
      permissionsCache.set(cacheKey, hasPermission)
      
      return hasPermission
    }
  }, [permissionsCache])

  const hasModuleAccess = useMemo(() => {
    return (moduleName: string, userType: 'internal' | 'client'): boolean => {
      // Audiencia: módulos internal/client/both vs tipo de usuario
      if (!audienceIncludes(moduleName, userType)) return false

      // Licensing: solo aplica a usuarios de cliente
      if (userType !== 'client' || !$userStore.customer) return true

      const cacheKey = `module-${moduleName}-${$userStore.customer.id}`

      if (permissionsCache.has(cacheKey)) {
        return permissionsCache.get(cacheKey)!
      }

      const hasAccess = $userStore.customer.modules.some(
        (m) => m.name === moduleName && m.customerModules.isActive
      )

      permissionsCache.set(cacheKey, hasAccess)
      return hasAccess
    }
  }, [$userStore.customer, permissionsCache])

  const getLinkToCustomer = useMemo(() => {
    return (to: string, userStore: UserData): string => {
      if (!userStore.customer) {
        return '/' // Ruta predeterminada para usuarios sin cliente
      } else {
        return `${to}${userStore.customer.id}`
      }
    }
  }, [])

  const filterItemsByPermissions = useMemo(() => {
    return (items: ModernSidebarItem[]): ModernSidebarItem[] => {
      const userType = getUserType($userStore)

      return items
        .filter(item => {
          // Verificar permisos de rol
          const hasRolePermission = canViewModule(item.roles, $userStore.rol)
          if (!hasRolePermission) return false

          // Verificar audiencia + licensing del módulo
          const hasModulePermission = hasModuleAccess(item.moduleName, userType)
          if (!hasModulePermission) return false

          return true
        })
        .map(item => {
          // Si es un dropdown, filtrar sus elementos hijos (sin mutar el original)
          if (item.type === 'dropdown' && item.children) {
            const filteredChildren = item.children.filter(child =>
              canViewModule(child.roles, $userStore.rol) &&
              hasModuleAccess(child.moduleName, userType)
            )

            // Solo mostrar el dropdown si tiene elementos hijos visibles
            if (filteredChildren.length === 0) return null

            return { ...item, children: filteredChildren }
          }

          return item
        })
        .filter((item): item is ModernSidebarItem => item !== null)
    }
  }, [canViewModule, hasModuleAccess, $userStore])

  const isItemActive = useMemo(() => {
    return (item: ModernSidebarItem, currentPath: string): boolean => {
      if (item.type === 'link' && item.to) {
        return currentPath === item.to
      }
      
      if (item.type === 'dropdown' && item.children) {
        return item.children.some(child => 
          child.to && currentPath.startsWith(`/${child.to}`)
        )
      }
      
      return false
    }
  }, [])

  const getItemNotificationCount = useMemo(() => {
    return (itemId: string, notifications: Record<string, number>): number => {
      return notifications[itemId] || 0
    }
  }, [])

  // Limpiar cache cuando cambien los datos del usuario
  const clearPermissionsCache = () => {
    permissionsCache.clear()
  }

  return {
    userStore: $userStore,
    canViewModule,
    hasModuleAccess,
    getLinkToCustomer,
    filterItemsByPermissions,
    isItemActive,
    getItemNotificationCount,
    clearPermissionsCache
  }
}