import { Suspense, lazy } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Route, Routes, Outlet } from 'react-router-dom'

// Layout y autenticación
import Layout from './Components/Layout'
import RequireAuth from './Components/Authentication/RequireAuth'
import LmsOnlyGuard from './Components/Authentication/LmsOnlyGuard'

// Error pages
const NotFound = lazy(() => import('./pages/NotFound'))

import { useStore } from '@nanostores/react'
import { userStore } from './store/userStore'

import PublicRoutes from './routes/PublicRoutes'
import FleetRoutes from './routes/FleetRoutes'
import DataSheetRoutes from './routes/DataSheetRoutes'
import QuotationRoutes from './routes/QuotationRoutes'
import CalibrationRoutes from './routes/CalibrationRoutes'
import CustomerRoutes from './routes/CustomerRoutes'
import OtherRoutes from './routes/OtherRoutes'
import ProfileRoutes from './routes/ProfileRoutes'
import PuchasesRoutes from './routes/PurchasesRoutes'
import IotRoutes from './routes/IotRoutes'
import ModulesRoutes from './routes/ModulesRoutes'
import LmsRoutes from './routes/LmsRoutes'
import { Box, CircularProgress, Typography } from '@mui/material'
import LaboratoryRoutes from './routes/LaboratoryRoutes'
import NonConformRoutes from './routes/NonConformRoutes'
import MaintenanceRoutes from './routes/MaintenanceRoutes'
import AssetLifeSheetRoutes from './routes/AssetLifeSheetRoutes'
import CalibrationServiceRoutes from './routes/CalibrationServiceRoutes'

function Router() {
  const $userStore = useStore(userStore)

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Routes>
        {/* Rutas públicas */}
        {PublicRoutes}

        {/* Rutas protegidas */}
        <Route
          path='/'
          element={
            <RequireAuth>
              <LmsOnlyGuard>
                <Layout>
                  <Suspense
                    fallback={
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        height='100vh'
                        flexDirection='column'
                      >
                        <CircularProgress />
                        <Typography
                          variant='h6'
                          sx={{ mt: 2, color: 'text.secondary' }}
                        >
                          Cargando...
                        </Typography>
                      </Box>
                    }
                  >
                    <Outlet />
                  </Suspense>
                </Layout>
              </LmsOnlyGuard>
            </RequireAuth>
          }
        >
          {FleetRoutes($userStore.rol)}
          {DataSheetRoutes($userStore.rol)}
          {QuotationRoutes($userStore.rol)}
          {CalibrationRoutes($userStore.rol)}
          {CustomerRoutes($userStore.rol)}
          {ProfileRoutes($userStore.rol)}
          {PuchasesRoutes($userStore.rol)}
          {IotRoutes($userStore.rol)}
          {ModulesRoutes($userStore.rol)}
          {LmsRoutes($userStore.rol)}
          {LaboratoryRoutes($userStore.rol)}
          {NonConformRoutes($userStore.rol)}
          {MaintenanceRoutes($userStore.rol)}
          {AssetLifeSheetRoutes($userStore.rol)}
          {CalibrationServiceRoutes($userStore.rol)}
          {OtherRoutes($userStore.rol)}
        </Route>

        {/* Catch-all route for 404 - must be last */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </LocalizationProvider>
  )
}

export default Router
