import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const PlatformBillingPage = lazy(
  () => import('../pages/Admin/PlatformBillingPage')
)

/** Panel "Facturación de la nube": entra quien tiene `system:billing:view`. */
const PlatformBillingRoutes = (role: string[]) => {
  return (
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={localStorage.getItem('accessToken') !== null}
          userRole={role}
          permission={PERMISSIONS.SYSTEM_BILLING_VIEW}
        />
      }
    >
      <Route path='settings/cloud-billing' element={<PlatformBillingPage />} />
    </Route>
  )
}

export default PlatformBillingRoutes
