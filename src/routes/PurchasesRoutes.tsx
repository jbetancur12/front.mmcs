import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import PDFViewer from 'src/Components/DataSheet/PDFViewer'

import SuppliersTable from 'src/pages/SuppliersTable'

const SuppliersSelection = lazy(
  () => import('src/pages/Purchases/SupplierSelection')
)

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
        <Route path='purchases'>
          <Route path='supplier-selection' element={<SuppliersSelection />} />

          <Route
            path='supplier-selection/:id'
            element={<PDFViewer path='fog-mmcs-10' />}
          />
          <Route path='suppliers' element={<SuppliersTable />} />
        </Route>
      </Route>
    </>
  )
}

export default SupplierRoutes
