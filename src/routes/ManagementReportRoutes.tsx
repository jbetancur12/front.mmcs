import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const ManagementReportPage = lazy(() => import('src/pages/ManagementReport'))

/** Reporte gerencial mensual: entra quien tenga `reports:management:view`. */
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
    <Route path='management-report' element={<ManagementReportPage />} />
  </Route>
)

export default ManagementReportRoutes
