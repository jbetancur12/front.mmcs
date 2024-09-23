import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const Customers = lazy(() => import('../pages/Customers'))
const Customer = lazy(() => import('../pages/Customer'))

const PDFViewer = lazy(() => import('../Components/DataSheet/PDFViewer'))

const CustomerRoutes = (role: string) => {
  console.log('🚀 ~ CustomerRoutes ~ role:', role)
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'metrologist']}
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
            roles={['*']}
          />
        }
      >
        <Route path='customers'>
          <Route index element={<Customers />} />
          <Route path=':id' element={<Customer />} />
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
