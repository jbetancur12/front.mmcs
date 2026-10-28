import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const RolesPermissions = lazy(() => import('../pages/Admin/RolesPermissions'))
const RolesHelp = lazy(() => import('../pages/Admin/RolesHelp'))

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
    </>
  )
}

export default RbacRoutes
