import SignalLoader from 'src/Components/Common/SignalLoader'
import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'
import PersonnelManagementPage from 'src/pages/Admin/PersonnelManagementPage'
import Box from '@mui/material/Box'

const PDFViewer = lazy(() => import('src/Components/DataSheet/PDFViewer'))
const SuppliersTable = lazy(() => import('src/pages/Suppliers/SuppliersTable'))
const SupplierDetailsPage = lazy(
  () => import('src/pages/Suppliers/SupplierDetailsPage')
)
const SupplierEditPage = lazy(
  () => import('src/pages/Suppliers/SupplierEditPage')
)
const PurchaseRequest = lazy(
  () => import('src/pages/Purchases/PurchaseRequest')
)
const ListAllSupplierEvaluationsPage = lazy(
  () => import('src/Components/Purchases/ListAllSupplierEvaluationsPage')
)
const SuppliersSelection = lazy(
  () => import('src/pages/Purchases/SupplierSelection')
)

const PurchaseOrders = lazy(() => import('src/pages/Purchases/PurchaseOrders'))
const PurchaseVerifications = lazy(
  () => import('src/pages/Purchases/PurchaseVerifications')
)
const FiscalParametersPage = lazy(
  () => import('src/pages/Admin/FiscalParametersManagementPage')
)
const PurchaseStatistics = lazy(
  () => import('src/pages/Purchases/PurchaseStatistics')
)

// Helper component for PDFViewer with Suspense
const PDFViewerWithSuspense = ({ path }: { path: string }) => (
  <Suspense
    fallback={
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <SignalLoader />
      </Box>
    }
  >
    <PDFViewer path={path} />
  </Suspense>
)

const SupplierRoutes = (role: string[]) => {
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
      <Route element={guard(PERMISSIONS.PURCHASES_PERSONNEL_VIEW)}>
        <Route
          path='purchases/personnel-management'
          element={<PersonnelManagementPage />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_FISCAL_PARAMETER_MANAGE)}>
        <Route
          path='purchases/fiscal-parameters'
          element={<FiscalParametersPage />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_SUPPLIER_SELECTION_VIEW)}>
        <Route
          path='purchases/supplier-selection'
          element={<SuppliersSelection />}
        />
        <Route
          path='purchases/supplier-selection/:id'
          element={<PDFViewerWithSuspense path='fog-mmcs-10' />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_SUPPLIER_VIEW)}>
        <Route path='purchases/suppliers' element={<SuppliersTable />} />
        <Route
          path='purchases/suppliers/details/:supplierId'
          element={<SupplierDetailsPage />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_SUPPLIER_UPDATE)}>
        <Route
          path='purchases/suppliers/edit/:supplierId'
          element={<SupplierEditPage />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_EVALUATION_VIEW)}>
        <Route
          path='purchases/suppliers/evaluations'
          element={<ListAllSupplierEvaluationsPage />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_REPORT_VIEW)}>
        <Route
          path='purchases/suppliers/report'
          element={<PDFViewerWithSuspense path='fog-mmcs-11' />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_REQUEST_VIEW)}>
        <Route path='purchases/requests' element={<PurchaseRequest />} />
        <Route
          path='purchases/requests/:id'
          element={<PDFViewerWithSuspense path='fog-mmcs-12' />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_ORDER_VIEW)}>
        <Route path='purchases/orders' element={<PurchaseOrders />} />
        <Route
          path='purchases/orders/:id'
          element={<PDFViewerWithSuspense path='fog-mmcs-13' />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_VERIFICATION_VIEW)}>
        <Route
          path='purchases/verifications'
          element={<PurchaseVerifications />}
        />
        <Route
          path='purchases/verifications/:id'
          element={<PDFViewerWithSuspense path='fog-mmcs-14' />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.PURCHASES_STATISTICS_VIEW)}>
        <Route path='purchases/statistics' element={<PurchaseStatistics />} />
      </Route>
    </>
  )
}

export default SupplierRoutes
