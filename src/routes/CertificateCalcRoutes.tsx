import SignalLoader from 'src/Components/Common/SignalLoader'
import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'
import Box from '@mui/material/Box'
import FeatureGate from 'src/Components/Common/FeatureGate'

const CertificateCalcPage = lazy(() => import('src/pages/CertificateCalc'))

const CertificateCalcRoutes = (role: string[]) => {
  // Demo: con la función apagada en Ajustes › Funciones, FeatureGate lleva a la página no encontrada.
  // Reutiliza la capacidad de ver «Certificados a liberar»; la versión definitiva tendría la suya.
  return (
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={localStorage.getItem('accessToken') !== null}
          userRole={role}
          permission={PERMISSIONS.RELEASE_CERTIFICATE_VIEW}
        />
      }
    >
      <Route
        path='certificate-calc'
        element={
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '80vh'
                }}
              >
                <SignalLoader />
              </Box>
            }
          >
            <FeatureGate flag='certificate_calculation'>
              <CertificateCalcPage />
            </FeatureGate>
          </Suspense>
        }
      />
    </Route>
  )
}

export default CertificateCalcRoutes
