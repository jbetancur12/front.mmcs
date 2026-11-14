import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'
import FeatureGate from 'src/Components/Common/FeatureGate'

const ManagementReportPage = lazy(() => import('src/pages/ManagementReport'))

/** Reporte gerencial mensual: entra quien tenga `reports:management:view` y la función esté encendida (Ajustes › Funciones). */
const ManagementReportRoutes = (role: string[]) => (
  <Route
    element={
      <ProtectedRoute
        isAuthenticated={localStorage.getItem('accessToken') !== null}
        userRole={role}
        permission={PERMISSIONS.REPORTS_MANAGEMENT_VIEW}
      />
    }
  >
    <Route
      path='management-report'
      element={
        <FeatureGate flag='management_report'>
          <ManagementReportPage />
        </FeatureGate>
      }
    />
  </Route>
)

export default ManagementReportRoutes
