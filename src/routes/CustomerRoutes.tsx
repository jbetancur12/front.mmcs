import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { ROLES } from 'src/constants/roles'

const Customers = lazy(() => import('../pages/Customers'))
const ModernCustomer = lazy(() => import('../pages/ModernCustomer'))

const PDFViewer = lazy(() => import('../Components/DataSheet/PDFViewer'))
const DashboardCustomer = lazy(
  () => import('../Components/Dashboard/DashboardCustomer')
)

const CustomerRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[ROLES.ADMIN, ROLES.METROLOGIST, ROLES.USER]}
          />
        }
      >
        <Route path='customers'>
          <Route index element={<Customers />} />
        </Route>
      </Route>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[ROLES.ADMIN, ROLES.USER, ROLES.METROLOGIST]}
          />
        }
      >
        <Route path='customers'>
          <Route index element={<Customers />} />
          <Route path='certificates-due/:id' element={<DashboardCustomer />} />
          <Route path=':id' element={<ModernCustomer />} />
          <Route
            path=':id/schedule/pdf'
            element={<PDFViewer path='calibration-schedule' />}
          />
        </Route>
      </Route>
    </>
  )
}

export default CustomerRoutes
