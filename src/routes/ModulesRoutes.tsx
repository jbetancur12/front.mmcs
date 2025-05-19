import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const Modules = lazy(() => import('../pages/Modules'))

const ModulesRoutes = (role: string[]) => {
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
        <Route path='modules' element={<Modules />} />
      </Route>
    </>
  )
}

export default ModulesRoutes
