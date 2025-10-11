import { lazy, Suspense } from 'react' // Import lazy y Suspense
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute' // Asegúrate que la ruta sea correcta
import CircularProgress from '@mui/material/CircularProgress' // Para el fallback de Suspense
import Box from '@mui/material/Box' // Para centrar el fallback

const PDFViewer = lazy(() => import('src/Components/DataSheet/PDFViewer'))
const NonConformWorkReportPage = lazy(
  () => import('src/pages/NonConformWorkReport')
)

const NonConformRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin']}
          />
        }
      >
        <Route
          path='non-conform-work-reports'
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
                  <CircularProgress />
                </Box>
              }
            >
              <NonConformWorkReportPage />
            </Suspense>
          }
        />
        <Route
          path='non-conform-work-reports/:id'
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
                  <CircularProgress />
                </Box>
              }
            >
              <PDFViewer path='fogc-mmcs-16' />
            </Suspense>
          }
        />
      </Route>
    </>
  )
}

export default NonConformRoutes
