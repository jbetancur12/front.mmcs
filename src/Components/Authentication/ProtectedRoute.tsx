import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

interface ProtectedRouteProps {
  isAuthenticated: boolean
  userRole: string // El rol del usuario autenticado
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
  if (!isAuthenticated) {
    // Si el usuario no está autenticado, redirige al login.
    return <Navigate to={redirectPath} replace />
  }

  // Verifica si el rol del usuario está permitido
  if (!roles.includes('*') && !roles.includes(userRole)) {
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
