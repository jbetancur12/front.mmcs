import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

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

/**
 * MaintenanceRoutes defines the private routes for the maintenance module
 * These routes require authentication and specific role permissions
 *
 * @param role - Array of user roles to check permissions
 */
const MaintenanceRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[
              'admin',
              'mantenimiento',
              'technician',
              'maintenance_coordinator'
            ]}
          />
        }
      >
        {/* Dashboard - Main maintenance overview */}
        <Route path='maintenance' element={<MaintenanceDashboard />} />

        {/* Individual ticket view - Available to admin, maintenance, and technician roles */}
        <Route
          path='maintenance/tickets/:ticketId'
          element={<MaintenanceTicketDetails />}
        />
      </Route>

      {/* Technicians Management - Admin and Maintenance Coordinator */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'maintenance_coordinator']}
          />
        }
      >
        <Route
          path='maintenance/technicians'
          element={<MaintenanceTechnicians />}
        />
      </Route>

      {/* Billing Management - Admin, Maintenance, and Maintenance Coordinator */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'mantenimiento', 'maintenance_coordinator']}
          />
        }
      >
        <Route
          path='maintenance/billing'
          element={<MaintenanceBilling />}
        />
      </Route>
    </>
  )
}

export default MaintenanceRoutes
