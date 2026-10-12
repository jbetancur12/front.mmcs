import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const ProductosServicios = lazy(() => import('../pages/ProductosServicios'))

const ProductCatalogRoutes = (role: string[]) => {
  return (
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={localStorage.getItem('accessToken') !== null}
          userRole={role}
          permission={PERMISSIONS.CALIBRATION_PRODUCT_VIEW}
        />
      }
    >
      <Route path='productos-y-servicios' element={<ProductosServicios />} />
    </Route>
  )
}

export default ProductCatalogRoutes
