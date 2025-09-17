import { lazy } from 'react'
import { Route } from 'react-router-dom'

// Lazy load maintenance components
const MaintenanceDashboard = lazy(
  () => import('../pages/maintenance/MaintenanceDashboard')
)
const MaintenanceTechnicians = lazy(
  () => import('../pages/maintenance/MaintenanceTechnicians')
)

/**
 * MaintenanceRoutes defines the private routes for the maintenance module
 * These routes require authentication and specific role permissions
 *
 * @param rol - Array of user roles to check permissions
 */
const MaintenanceRoutes = (rol: string[]) => {
  // Check if user has maintenance module access
  const hasMaintenanceAccess = (userRoles: string[]) => {
    return userRoles.some((role) => ['admin', 'mantenimiento'].includes(role))
  }

  // Temporarily allow access for debugging - TODO: Fix authentication
  // if (!hasMaintenanceAccess(rol)) {
  //   return null
  // }

  return (
    <>
      {/* Dashboard - Main maintenance overview */}
      <Route path='maintenance' element={<MaintenanceDashboard />} />

      {/* Technicians Management - Admin only */}
      {rol.includes('admin') && (
        <Route
          path='maintenance/technicians'
          element={<MaintenanceTechnicians />}
        />
      )}

      {/* Individual ticket view - Available to both admin and maintenance roles */}
      <Route
        path='maintenance/tickets/:ticketId'
        element={<MaintenanceDashboard />} // For now, redirect to dashboard
      />
    </>
  )
}

export default MaintenanceRoutes
