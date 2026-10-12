import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { ROLE_GROUPS } from 'src/constants/roles'
import { PERMISSIONS } from 'src/constants/permissions'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const Settings = lazy(() => import('../pages/Settings'))
const Clientes = lazy(() => import('../pages/Clientes'))
const Repository = lazy(() => import('../pages/Repository'))
const WelcomeScreen = lazy(() => import('../pages/Welcome'))
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
            roles={ROLE_GROUPS.ADMIN_AND_CLIENT}
            fallbackRoute={true} // Si no es admin, redirige a /welcome
          />
        }
      >
        <Route index element={<Dashboard />} />

        <Route path='users' element={<Clientes />} />
      </Route>

      {/* Repositorio de archivos y utilidades de administración: cada una pide su capacidad; si no, a /welcome */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.REPOSITORIES_REPOSITORY_VIEW}
            fallbackRoute={true}
          />
        }
      >
        <Route path='/repository' element={<Repository />} />
      </Route>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.TOOLS_UTILITY_USE}
            fallbackRoute={true}
          />
        }
      >
        <Route path='/excel-manipulation' element={<ExcelManipulation />} />
        <Route path='/pdf-script' element={<ScriptGenerator />} />
        <Route path='/gotemberg' element={<Gotemberg />} />
      </Route>

      {/* Ajustes (usuarios y roles): quien puede listar los usuarios; si no, a /welcome */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.USERS_USER_LIST}
            fallbackRoute={true}
          />
        }
      >
        <Route path='settings' element={<Settings />} />
      </Route>

      {/* Ruta de bienvenida para usuarios que no son admin */}
      <Route path='/welcome' element={<WelcomeScreen />} />
    </>
  )
}

export default OtherRoutes
