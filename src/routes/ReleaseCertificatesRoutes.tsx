import SignalLoader from 'src/Components/Common/SignalLoader'
import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'
import Box from '@mui/material/Box'
import FeatureGate from 'src/Components/Common/FeatureGate'

const ReleaseCertificatesPage = lazy(
  () => import('src/pages/ReleaseCertificates')
)

const ReleaseCertificatesRoutes = (role: string[]) => {
  // Con la función apagada en Ajustes › Funciones, FeatureGate lleva a la página no encontrada
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
        path='release-certificates'
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
            <FeatureGate flag='release_certificates'>
              <ReleaseCertificatesPage />
            </FeatureGate>
          </Suspense>
        }
      />
    </Route>
  )
}

export default ReleaseCertificatesRoutes
