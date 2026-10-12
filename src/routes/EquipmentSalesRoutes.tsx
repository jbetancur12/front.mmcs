import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'

const EquipmentSalesPage = lazy(
  () => import('../pages/equipment-sales/EquipmentSalesPage')
)
const EquipmentSalesWorkspacePage = lazy(
  () => import('../pages/equipment-sales/EquipmentSalesWorkspacePage')
)
const EquipmentSalesDetailPage = lazy(
  () => import('../pages/equipment-sales/EquipmentSalesDetailPage')
)
const EquipmentProductsPage = lazy(
  () => import('../pages/equipment-sales/EquipmentProductsPage')
)

const EquipmentSalesRoutes = (role: string[]) => {
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
      <Route element={guard(PERMISSIONS.SALES_QUOTATION_VIEW)}>
        <Route path='equipment-sales' element={<EquipmentSalesPage />} />
        <Route
          path='equipment-sales/:quotationId'
          element={<EquipmentSalesDetailPage />}
        />
      </Route>

      <Route element={guard(PERMISSIONS.SALES_PRODUCT_VIEW)}>
        <Route
          path='equipment-sales/products'
          element={<EquipmentProductsPage />}
        />
      </Route>

      <Route element={guard(PERMISSIONS.SALES_QUOTATION_CREATE)}>
        <Route
          path='equipment-sales/new'
          element={<EquipmentSalesWorkspacePage />}
        />
      </Route>

      <Route element={guard(PERMISSIONS.SALES_QUOTATION_UPDATE)}>
        <Route
          path='equipment-sales/:quotationId/edit'
          element={<EquipmentSalesWorkspacePage />}
        />
      </Route>
    </>
  )
}

export default EquipmentSalesRoutes
