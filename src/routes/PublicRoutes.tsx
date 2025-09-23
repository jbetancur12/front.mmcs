import { lazy } from 'react'
import { Route } from 'react-router-dom'

const Login = lazy(() => import('../pages/Login'))
const NewPassword = lazy(() => import('../Components/NewPassword'))
const PasswordRecovery = lazy(() => import('../pages/PasswordRecovery'))
const NotAuthorizedPage = lazy(() => import('../pages/NotAuthorizedPage'))
const MaintenanceReport = lazy(
  () => import('../pages/maintenance/MaintenanceReport')
)
const MaintenanceTracking = lazy(
  () => import('../pages/maintenance/MaintenanceTracking')
)
const MaintenanceTVDisplayPage = lazy(
  () => import('../pages/MaintenanceTVDisplayPage')
)

const PublicRoutes = (
  <>
    <Route path='/login' element={<Login />} />
    <Route path='/new-password' element={<NewPassword />} />
    <Route path='/password-recovery' element={<PasswordRecovery />} />
    {/* Public Maintenance Routes */}
    <Route path='/maintenance/report' element={<MaintenanceReport />} />
    <Route path='/maintenance/tracking' element={<MaintenanceTracking />} />
    <Route path='/maintenance/track' element={<MaintenanceTracking />} />
    {/* TV Display Route */}
    <Route path='/tv-display' element={<MaintenanceTVDisplayPage />} />
    <Route path='/not-authorized' element={<NotAuthorizedPage />} />
  </>
)

export default PublicRoutes
