import { Suspense } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Route, Routes } from 'react-router-dom'

// Layout y autenticación
import Layout from './Components/Layout'
import RequireAuth from './Components/Authentication/RequireAuth'

// Utils
import useSessionTimeoutWarning from '@utils/use-expiry-time'
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
import { Box, CircularProgress, Typography } from '@mui/material'

function Router() {
  // useSessionTimeoutWarning({ warningMinutesBefore: 5 })
  const $userStore = useStore(userStore)

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
              Cargando...
            </Typography>
          </Box>
        }
      >
        <Routes>
          {/* Rutas públicas */}
          {PublicRoutes}

          {/* Rutas protegidas */}
          <Route
            path='/'
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            {FleetRoutes($userStore.rol)}
            {DataSheetRoutes($userStore.rol)}
            {QuotationRoutes($userStore.rol)}
            {CalibrationRoutes($userStore.rol)}
            {CustomerRoutes($userStore.rol)}
            {ProfileRoutes($userStore.rol)}
            {OtherRoutes($userStore.rol)}
          </Route>
        </Routes>
      </Suspense>
    </LocalizationProvider>
  )
}

export default Router
