import SignalLoader from 'src/Components/Common/SignalLoader'
import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'
import Box from '@mui/material/Box'
import { releaseCertificatesEnabled } from 'src/features/releaseCertificatesFlags'

const ReleaseCertificatesPage = lazy(
  () => import('src/pages/ReleaseCertificates')
)

const ReleaseCertificatesRoutes = (role: string[]) => {
  // Oculto hasta darlo por listo (src/features/releaseCertificatesFlags.ts): sin ruta, cae en la página no encontrada
  if (!releaseCertificatesEnabled) return null

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
            <ReleaseCertificatesPage />
          </Suspense>
        }
      />
    </Route>
  )
}

export default ReleaseCertificatesRoutes
