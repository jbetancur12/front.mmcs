import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import {
  EQUIPMENT_SALES_ALLOWED_ROLES,
  EQUIPMENT_SALES_EDIT_ROLES
} from '../constants/equipmentSales'

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
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[...EQUIPMENT_SALES_ALLOWED_ROLES]}
          />
        }
      >
        <Route
          path='equipment-sales'
          element={<EquipmentSalesPage />}
        />
        <Route
          path='equipment-sales/products'
          element={<EquipmentProductsPage />}
        />
        <Route
          path='equipment-sales/:quotationId'
          element={<EquipmentSalesDetailPage />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[...EQUIPMENT_SALES_EDIT_ROLES]}
          />
        }
      >
        <Route
          path='equipment-sales/new'
          element={<EquipmentSalesWorkspacePage />}
        />
        <Route
          path='equipment-sales/:quotationId/edit'
          element={<EquipmentSalesWorkspacePage />}
        />
      </Route>
    </>
  )
}

export default EquipmentSalesRoutes
