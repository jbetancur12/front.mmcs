import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import BandwidthStats from 'src/pages/Bandwith/BandWidth'
import WelcomeScreen from 'src/pages/Welcome' // Asegúrate de tener este componente

const Dashboard = lazy(() => import('../pages/Dashboard'))
const Settings = lazy(() => import('../pages/Settings'))
const Clientes = lazy(() => import('../pages/Clientes'))
const Zip = lazy(() => import('../pages/Zip'))
const Repository = lazy(() => import('../pages/Repository'))
const ExcelManipulation = lazy(
  () => import('../Components/ExcelManipulation/ExcelManipulation')
)
const ScriptGenerator = lazy(() => import('../Components/ScriptGenerator'))
const Gotemberg = lazy(() => import('../Components/Gotemberg'))

const OtherRoutes = (role: string[]) => {
  return (
    <>
      {/* Rutas protegidas para Admin; si el usuario no es admin, fallback a /welcome. */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'user']}
            fallbackRoute={true} // Si no es admin, redirige a /welcome
          />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path='settings' element={<Settings />} />
        <Route path='bandwith' element={<BandwidthStats />} />
        <Route path='users' element={<Clientes />} />
        <Route path='/zip' element={<Zip />} />
        <Route path='/repository' element={<Repository />} />
        <Route path='/excel-manipulation' element={<ExcelManipulation />} />
        <Route path='/pdf-script' element={<ScriptGenerator />} />
        <Route path='/gotemberg' element={<Gotemberg />} />
      </Route>

      {/* Ruta de bienvenida para usuarios que no son admin */}
      <Route path='/welcome' element={<WelcomeScreen />} />
    </>
  )
}

export default OtherRoutes
