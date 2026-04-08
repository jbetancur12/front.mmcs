import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const ProductosServicios = lazy(() => import('../pages/ProductosServicios'))

const ProductCatalogRoutes = (role: string[]) => {
  return (
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={localStorage.getItem('accessToken') !== null}
          userRole={role}
          roles={['admin']}
        />
      }
    >
      <Route path='productos-y-servicios' element={<ProductosServicios />} />
    </Route>
  )
}

export default ProductCatalogRoutes
