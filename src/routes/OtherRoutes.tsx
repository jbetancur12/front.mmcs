import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

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

const OtherRoutes = (role: string) => {
  return (
    <>
      {/* Shared routes */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['*']}
          />
        }
      >
        <Route index element={<Dashboard />} />
      </Route>

      {/* Admin routes */}

      <Route
        element={
          <ProtectedRoute
            roles={['admin']}
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
          />
        }
      >
        {/* Hojas de datos */}
        <Route path='settings' element={<Settings />} />

        {/* Clientes y usuarios */}
        <Route path='users' element={<Clientes />} />

        {/* Rutas adicionales */}
        <Route path='/zip' element={<Zip />} />
        <Route path='/repository' element={<Repository />} />
        <Route path='/excel-manipulation' element={<ExcelManipulation />} />
        <Route path='/pdf-script' element={<ScriptGenerator />} />
        <Route path='/gotemberg' element={<Gotemberg />} />
      </Route>
    </>
  )
}

export default OtherRoutes
