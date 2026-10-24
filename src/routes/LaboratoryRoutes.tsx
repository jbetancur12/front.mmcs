import { lazy, Suspense } from 'react' // Import lazy y Suspense
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute' // Asegúrate que la ruta sea correcta
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'
import SignalLoader from 'src/Components/Common/SignalLoader'

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
  const isAuthenticated = localStorage.getItem('accessToken') !== null

  // Cada página exige la capacidad que el backend le pide a sus endpoints
  const guard = (permission: PermissionKey | readonly PermissionKey[]) => (
    <ProtectedRoute
      isAuthenticated={isAuthenticated}
      userRole={role}
      permission={permission}
    />
  )

  const fallback = <SignalLoader fullPage />

  return (
    <>
      <Route element={guard(PERMISSIONS.LABORATORY_DEVICE_VIEW)}>
        <Route
          path='laboratory/conditions'
          element={
            <Suspense fallback={fallback}>
              <LaboratoryConditions />
            </Suspense>
          }
        />
      </Route>
      <Route element={guard(PERMISSIONS.LABORATORY_CALIBRATION_VIEW)}>
        <Route
          path='laboratory/patterns'
          element={
            <Suspense fallback={fallback}>
              <LaboratoryPatterns />
            </Suspense>
          }
        />
      </Route>
    </>
  )
}

export default LaboratoryRoutes
