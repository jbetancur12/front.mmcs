import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import PDFViewer from 'src/Components/DataSheet/PDFViewer'

const SuppliersTable = lazy(() => import('src/pages/SuppliersTable'))
const PurchaseRequest = lazy(
  () => import('src/pages/Purchases/PurchaseRequest')
)

const SuppliersSelection = lazy(
  () => import('src/pages/Purchases/SupplierSelection')
)

const PurchaseOrders = lazy(() => import('src/pages/Purchases/PurchaseOrders'))
const PurchaseVerifications = lazy(
  () => import('src/pages/Purchases/PurchaseVerifications')
)

const SupplierRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'comp_requester', 'comp_supervisor']}
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
          <Route
            path='suppliers/report'
            element={<PDFViewer path='fog-mmcs-11' />}
          />
          <Route path='requests' element={<PurchaseRequest />} />
          <Route
            path='requests/:id'
            element={<PDFViewer path='fog-mmcs-12' />}
          />
          <Route path='orders' element={<PurchaseOrders />} />
          <Route path='orders/:id' element={<PDFViewer path='fog-mmcs-13' />} />
          <Route path='verifications' element={<PurchaseVerifications />} />
          <Route
            path='verifications/:id'
            element={<PDFViewer path='fog-mmcs-14' />}
          />
        </Route>
      </Route>
    </>
  )
}

export default SupplierRoutes
