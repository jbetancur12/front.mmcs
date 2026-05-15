import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  isAuthenticated: boolean
  userRole: string[] // El rol del usuario autenticado
  roles: string[] // Roles permitidos para la ruta, puede incluir '*'
  redirectPath?: string
  unauthorizedPath?: string
  fallbackRoute?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  userRole,
  roles,
  redirectPath = '/login',
  unauthorizedPath = '/not-authorized',
  fallbackRoute = false
}) => {
  const location = useLocation()

  if (!isAuthenticated) {
    // Guardar la ubicación actual antes de redirigir al login
    const currentPath = location.pathname + location.search
    sessionStorage.setItem('lastLocation', currentPath)
    return <Navigate to={redirectPath} replace />
  }

  // Verifica si el rol del usuario está permitido
  if (!roles.includes('*') && !userRole.some((role) => roles.includes(role))) {
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
