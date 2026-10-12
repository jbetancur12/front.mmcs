import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const Modules = lazy(() => import('../pages/Modules'))

const ModulesRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.CUSTOMERS_MODULE_CATALOG_VIEW}
          />
        }
      >
        <Route path='modules' element={<Modules />} />
      </Route>
    </>
  )
}

export default ModulesRoutes
