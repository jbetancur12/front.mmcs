import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import SuppliersTable from 'src/pages/SuppliersTable'

const Suppliers = lazy(() => import('../pages/Suppliers'))

const SupplierRoutes = (role: string) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['*']}
          />
        }
      >
        <Route path='suppliers'>
          <Route index element={<Suppliers />} />
          <Route path='table' element={<SuppliersTable />} />
        </Route>
      </Route>
    </>
  )
}

export default SupplierRoutes
