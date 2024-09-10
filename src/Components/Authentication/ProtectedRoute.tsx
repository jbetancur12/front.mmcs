import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

interface ProtectedRouteProps {
  isAuthenticated: boolean
  userRole: string // El rol del usuario autenticado
  roles: string[] // Roles permitidos para la ruta, puede incluir '*'
  redirectPath?: string
  unauthorizedPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  userRole,
  roles,
  redirectPath = '/login',
  unauthorizedPath = '/not-authorized'
}) => {
  if (!isAuthenticated) {
    // Si el usuario no está autenticado, redirigir al login
    return <Navigate to={redirectPath} replace />
  }

  // Verificar si el array de roles contiene '*' o si el rol del usuario está permitido
  if (!roles.includes('*') && !roles.includes(userRole)) {
    // Si no tiene el rol necesario, redirigir a "No autorizado"
    return <Navigate to={unauthorizedPath} replace />
  }

  // Si está autenticado y tiene los permisos necesarios, renderiza el contenido
  return <Outlet />
}

export default ProtectedRoute
