import { lazy, Suspense } from 'react' // Import lazy y Suspense
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute' // Asegúrate que la ruta sea correcta
import CircularProgress from '@mui/material/CircularProgress' // Para el fallback de Suspense
import Box from '@mui/material/Box' // Para centrar el fallback

// --- Importación Lazy de Componentes de Laboratorio ---
// Asegúrate de que las rutas y nombres de archivo/componente sean correctos
const LaboratoryConditions = lazy(
  // Asume que tienes un componente para la página de Condiciones
  () => import('../Components/LaboratoryData/LaboratoryMonitor')
)
const LaboratoryPatterns = lazy(
  // Asume que tienes un componente para la página de Patrones
  () => import('../Components/LaboratoryMonitor/views/CalibrationChamberView')
)
// Si tienes una página principal o dashboard para Laboratorio, impórtala también
// const LaboratoryDashboard = lazy(() => import('../Components/Laboratory/LaboratoryDashboard'));

// Componente funcional que define las rutas de Laboratorio
// Recibe los roles del usuario actual como prop para ProtectedRoute
const LaboratoryRoutes = (role: string[]) => {
  return (
    <>
      {/* Envolver las rutas específicas en ProtectedRoute */}
      <Route
        element={
          <ProtectedRoute
            // Verifica si el usuario está autenticado (ej: revisando el token)
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role} // Roles del usuario actual
            roles={['admin']} // Roles permitidos para acceder a estas rutas (ajusta según necesidad)
          />
        }
      >
        {/* Ruta base para la sección de Laboratorio */}
        {/* Puedes tener una ruta 'index' si hay una página principal */}
        {/* <Route path='laboratory' element={<LaboratoryDashboard />} /> */}

        {/* Rutas anidadas para las sub-secciones */}
        {/* Usamos Suspense para manejar la carga de los componentes lazy */}
        <Route
          path='laboratory/conditions' // Ruta para Condiciones
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
              <LaboratoryConditions />
            </Suspense>
          }
        />
        <Route
          path='laboratory/patterns' // Ruta para Patrones
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
              <LaboratoryPatterns />
            </Suspense>
          }
        />
        {/* Agrega aquí más rutas anidadas si es necesario */}
      </Route>
    </>
  )
}

export default LaboratoryRoutes
