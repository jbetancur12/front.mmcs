import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'

const Customers = lazy(() => import('../pages/Customers'))
const ModernCustomer = lazy(() => import('../pages/ModernCustomer'))

const PDFViewer = lazy(() => import('../Components/DataSheet/PDFViewer'))
const DashboardCustomer = lazy(
  () => import('../Components/Dashboard/DashboardCustomer')
)

const CustomerRoutes = (role: string[]) => {
  const isAuthenticated = localStorage.getItem('accessToken') !== null

  // Cada página exige la capacidad que el backend le pide a sus endpoints
  const guard = (permission: PermissionKey | readonly PermissionKey[]) => (
    <ProtectedRoute
      isAuthenticated={isAuthenticated}
      userRole={role}
      permission={permission}
    />
  )

  return (
    <>
      {/* Listado de empresas: solo quien las gestiona (el usuario de una empresa cliente va a su ficha) */}
      <Route element={guard(PERMISSIONS.CUSTOMERS_CUSTOMER_MANAGE)}>
        <Route path='customers'>
          <Route index element={<Customers />} />
        </Route>
      </Route>
      <Route element={guard(PERMISSIONS.CUSTOMERS_CUSTOMER_VIEW)}>
        <Route path='customers'>
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
