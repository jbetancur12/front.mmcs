import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { hasPermission, PermissionKey } from 'src/constants/permissions'

interface ProtectedRouteProps {
  isAuthenticated: boolean
  userRole: string[] // El rol del usuario autenticado
  roles?: string[] // Roles permitidos para la ruta, puede incluir '*'
  /**
   * Capacidad(es) que habilitan la ruta (any-of), según lo que el backend dice que el usuario
   * puede hacer. Si se indica, tiene prioridad sobre `roles`.
   */
  permission?: PermissionKey | readonly PermissionKey[]
  redirectPath?: string
  unauthorizedPath?: string
  fallbackRoute?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  userRole,
  roles = [],
  permission,
  redirectPath = '/login',
  unauthorizedPath = '/not-authorized',
  fallbackRoute = false
}) => {
  const location = useLocation()
  const $userStore = useStore(userStore)

  if (!isAuthenticated) {
    // Guardar la ubicación actual antes de redirigir al login
    const currentPath = location.pathname + location.search
    sessionStorage.setItem('lastLocation', currentPath)
    return <Navigate to={redirectPath} replace />
  }

  // Con `permission` se decide por capacidad; si no, por rol como siempre
  const allowed = permission
    ? hasPermission($userStore.permissions, permission)
    : roles.includes('*') || userRole.some((role) => roles.includes(role))

  if (!allowed) {
    // Si el usuario no tiene el rol requerido, se evalúa fallbackRoute.
    if (fallbackRoute) {
      return <Navigate to='/welcome' replace />
    }
    return <Navigate to={unauthorizedPath} replace />
  }

  // Si está autenticado y tiene permisos, se renderiza el contenido.
  return <Outlet />
}

export default ProtectedRoute
