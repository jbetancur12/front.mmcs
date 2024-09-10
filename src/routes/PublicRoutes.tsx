import { lazy } from 'react'
import { Route } from 'react-router-dom'

const Login = lazy(() => import('../pages/Login'))
const NewPassword = lazy(() => import('../Components/NewPassword'))
const PasswordRecovery = lazy(() => import('../pages/PasswordRecovery'))
const NotFound = lazy(() => import('../pages/NotFound'))
const NotAuthorizedPage = lazy(() => import('../pages/NotAuthorizedPage'))

const PublicRoutes = (
  <>
    <Route path='/login' element={<Login />} />
    <Route path='/new-password' element={<NewPassword />} />
    <Route path='/password-recovery' element={<PasswordRecovery />} />
    {/* Error 404 */}
    <Route path='*' element={<NotFound />} />
    <Route path='/not-authorized' element={<NotAuthorizedPage />} />
  </>
)

export default PublicRoutes
