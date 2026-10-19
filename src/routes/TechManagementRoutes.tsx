import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const TechManagementHome = lazy(() => import('../pages/techManagement/TechManagementHome'))
const TechManagementCustomerPage = lazy(() => import('../pages/techManagement/TechManagementCustomerPage'))
const EquipmentDetailPage = lazy(() => import('../pages/techManagement/EquipmentDetailPage'))
const InvimaAlertsPage = lazy(() => import('../pages/techManagement/InvimaAlertsPage'))

const isAuthenticated = () => localStorage.getItem('accessToken') !== null

const TechManagementRoutes = (role: string[]) => (
  <>
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={isAuthenticated()}
          userRole={role}
          permission={PERMISSIONS.TECH_INVENTORY_VIEW}
        />
      }
    >
      <Route path='tech-management' element={<TechManagementHome />} />
      <Route path='tech-management/customers/:customerId' element={<TechManagementCustomerPage />} />
      <Route
        path='tech-management/customers/:customerId/equipment/:equipmentId'
        element={<EquipmentDetailPage />}
      />
    </Route>
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={isAuthenticated()}
          userRole={role}
          permission={PERMISSIONS.TECH_ALERT_MANAGE}
        />
      }
    >
      <Route path='tech-management/alerts' element={<InvimaAlertsPage />} />
    </Route>
  </>
)

export default TechManagementRoutes
