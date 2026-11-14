import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const RolesPermissions = lazy(() => import('../pages/Admin/RolesPermissions'))
const RolesHelp = lazy(() => import('../pages/Admin/RolesHelp'))
const FeatureFlagsPage = lazy(() => import('../pages/Admin/FeatureFlagsPage'))

/** Panel "Roles y permisos": entra quien el backend dice que tiene `rbac:view`. */
const RbacRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.RBAC_VIEW}
          />
        }
      >
        <Route path='settings/roles' element={<RolesPermissions />} />
        <Route path='settings/roles/ayuda' element={<RolesHelp />} />
      </Route>
      {/* Panel de desarrollador: interruptores de funciones en construcción */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.SYSTEM_FEATURE_FLAGS_MANAGE}
          />
        }
      >
        <Route path='settings/features' element={<FeatureFlagsPage />} />
      </Route>
    </>
  )
}

export default RbacRoutes
