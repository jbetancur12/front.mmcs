import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

// Lazy load maintenance components
const MaintenanceDashboard = lazy(
  () => import('../pages/maintenance/MaintenanceDashboard')
)
const MaintenanceTechnicians = lazy(
  () => import('../pages/maintenance/MaintenanceTechnicians')
)
const MaintenanceTicketDetails = lazy(
  () => import('../pages/maintenance/MaintenanceTicketDetails')
)
const MaintenanceBilling = lazy(
  () => import('../Components/Maintenance/MaintenanceBilling')
)
const MaintenanceProtocols = lazy(
  () => import('../pages/maintenance/MaintenanceProtocols')
)
const MaintenanceAnalytics = lazy(
  () => import('../pages/maintenance/MaintenanceAnalytics')
)

/**
 * MaintenanceRoutes defines the private routes for the maintenance module
 * These routes require authentication and the capability that the backend grants to the
 * user's role (see constants/permissions.ts); a role change in the admin panel applies on
 * the next navigation.
 *
 * @param role - Array of user roles to check permissions
 */
const MaintenanceRoutes = (role: string[]) => {
  const isAuthenticated = localStorage.getItem('accessToken') !== null

  return (
    <>
      {/* Dashboard y detalle de ticket */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={role}
            permission={PERMISSIONS.MAINTENANCE_TICKET_VIEW}
          />
        }
      >
        <Route path='maintenance' element={<MaintenanceDashboard />} />
        <Route
          path='maintenance/tickets/:ticketId'
          element={<MaintenanceTicketDetails />}
        />
      </Route>
      {/* Analítica */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={role}
            permission={PERMISSIONS.MAINTENANCE_ANALYTICS_VIEW}
          />
        }
      >
        <Route path='maintenance/analytics' element={<MaintenanceAnalytics />} />
      </Route>
      {/* Gestión de técnicos */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={role}
            permission={PERMISSIONS.MAINTENANCE_TECHNICIAN_LIST}
          />
        }
      >
        <Route
          path='maintenance/technicians'
          element={<MaintenanceTechnicians />}
        />
      </Route>
      {/* Gestión de protocolos */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={role}
            permission={PERMISSIONS.MAINTENANCE_PROTOCOL_MANAGE}
          />
        }
      >
        <Route
          path='maintenance/protocols'
          element={<MaintenanceProtocols />}
        />
      </Route>
      {/* Facturación */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={role}
            permission={PERMISSIONS.MAINTENANCE_INVOICING_VIEW}
          />
        }
      >
        <Route path='maintenance/billing' element={<MaintenanceBilling />} />
      </Route>
    </>
  )
}

export default MaintenanceRoutes
