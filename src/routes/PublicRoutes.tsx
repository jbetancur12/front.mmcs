import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'

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

const LoadingFallback = () => (
  <Box
    display='flex'
    justifyContent='center'
    alignItems='center'
    height='100vh'
    flexDirection='column'
  >
    <CircularProgress />
    <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
      Cargando...
    </Typography>
  </Box>
)

const PublicRoutes = (
  <>
    <Route
      path='/login'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <Login />
        </Suspense>
      }
    />
    <Route
      path='/new-password'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <NewPassword />
        </Suspense>
      }
    />
    <Route
      path='/password-recovery'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <PasswordRecovery />
        </Suspense>
      }
    />
    {/* Public Maintenance Routes */}
    <Route
      path='/maintenance/report'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <MaintenanceReport />
        </Suspense>
      }
    />
    <Route
      path='/maintenance/tracking'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <MaintenanceTracking />
        </Suspense>
      }
    />
    <Route
      path='/maintenance/track'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <MaintenanceTracking />
        </Suspense>
      }
    />
    {/* TV Display Route */}
    <Route
      path='/tv-display'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <MaintenanceTVDisplayPage />
        </Suspense>
      }
    />
    <Route
      path='/not-authorized'
      element={
        <Suspense fallback={<LoadingFallback />}>
          <NotAuthorizedPage />
        </Suspense>
      }
    />
  </>
)

export default PublicRoutes
